import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Audit aksesibilitas otomatis (WCAG 2.1 A/AA) di setiap halaman, mode terang
 * dan gelap, memakai akun demo yang dibuat oleh `seed:demo`.
 */
const PAGES = [
  ['beranda', '/'],
  ['jadwal minggu', '/schedule?view=week'],
  ['jadwal bulan', '/schedule?view=month'],
  ['jadwal hari', '/schedule?view=day'],
  ['to-do', '/tasks'],
  ['habit', '/habits'],
  ['goals', '/goals'],
  ['fokus', '/focus'],
  ['keuangan', '/finance'],
  ['dzikir', '/dhikr?group=pagi'],
  ['hafidz', '/memorization'],
  ['jurnal', '/journal'],
  ['kajian', '/lecture-notes'],
  ['kajian baru', '/lecture-notes/new'],
  ['pengaturan', '/settings'],
] as const;

async function audit(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }));
}

/**
 * Pindah halaman lewat router SPA, tanpa memuat ulang. Muat ulang memanggil
 * `/auth/refresh` yang dibatasi 30 kali per menit.
 */
async function spaGoto(page: Page, url: string) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, url);
  await page.waitForURL((u) => `${u.pathname}${u.search}` === url);
}

async function loginDemo(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@muhasabah.local');
  await page.getByLabel('Kata sandi').fill('demo12345');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByTestId('prayer-list')).toBeVisible();
}

test('halaman masuk tanpa pelanggaran', async ({ page }) => {
  await page.goto('/login');
  expect(await audit(page)).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`landing page tanpa pelanggaran (mode ${scheme === 'light' ? 'terang' : 'gelap'})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/welcome');
    expect(await audit(page)).toEqual([]);
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`semua halaman tanpa pelanggaran (mode ${scheme === 'light' ? 'terang' : 'gelap'})`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ colorScheme: scheme });
    // Satu kali masuk untuk semua halaman: endpoint auth dibatasi 10 permintaan per menit.
    await loginDemo(page);
    const found: Record<string, Awaited<ReturnType<typeof audit>>> = {};
    for (const [name, url] of PAGES) {
      await test.step(name, async () => {
        await spaGoto(page, url);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('main h1').first()).toBeVisible();
        // Tunggu transisi warna tema selesai sebelum mengukur kontras.
        await page.waitForTimeout(300);
        const violations = await audit(page);
        if (violations.length) found[name] = violations;
      });
    }

    // Dialog juga diaudit dalam keadaan terbuka.
    const DIALOGS = [
      ['/tasks', 'Tugas baru'],
      ['/habits', 'Tambah habit'],
      ['/goals', 'Goal baru'],
      ['/schedule?view=week', 'Agenda baru'],
      ['/memorization', 'Rencana baru'],
      ['/finance', 'Catat'],
      ['/finance', 'Kategori'],
    ] as const;
    for (const [url, button] of DIALOGS) {
      await test.step(`dialog ${button}`, async () => {
        await spaGoto(page, url);
        await page.getByRole('button', { name: button, exact: true }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.waitForTimeout(300);
        const violations = await audit(page);
        if (violations.length) found[`dialog ${button}`] = violations;
        await page.keyboard.press('Escape');
      });
    }
    expect(found).toEqual({});
  });
}
