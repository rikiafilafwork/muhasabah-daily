/**
 * Membuat tangkapan layar README dari akun demo.
 *
 * Prasyarat: `pnpm dev` berjalan dan `pnpm --filter api seed:demo` sudah dijalankan.
 * Pemakaian: pnpm --filter web screenshots   (opsional: BASE_URL=http://localhost:5173)
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = fileURLToPath(new URL('../../../docs/screenshots/', import.meta.url));
const DESKTOP = { width: 1280, height: 860 };
const MOBILE = { width: 390, height: 844 };

/** Jam tiruan pukul 10.15 WIB hari ini, agar tampilan konsisten (siang, menuju Dzuhur). */
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
const FIXED_TIME = new Date(`${today}T10:15:00+07:00`);

const SHOTS = [
  { name: 'beranda', url: '/' },
  { name: 'jadwal-hari', url: '/schedule?view=day' },
  { name: 'jadwal-minggu', url: '/schedule?view=week' },
  { name: 'todo', url: '/tasks?view=focus' },
  { name: 'habit', url: '/habits' },
  { name: 'goals', url: '/goals' },
  { name: 'fokus', url: '/focus' },
  { name: 'keuangan', url: '/finance' },
  { name: 'dzikir', url: '/dhikr?group=pagi' },
  { name: 'hafidz', url: '/memorization' },
  { name: 'jurnal', url: '/journal' },
  { name: 'kajian', url: '/lecture-notes' },
  { name: 'beranda-gelap', url: '/', dark: true },
  { name: 'dzikir-gelap', url: '/dhikr?group=pagi', dark: true },
  { name: 'beranda-mobile', url: '/', mobile: true },
  { name: 'habit-mobile', url: '/habits', mobile: true },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: DESKTOP,
      colorScheme: scheme,
      timezoneId: 'Asia/Jakarta',
      locale: 'id-ID',
    });
    const page = await context.newPage();
    await page.clock.install({ time: FIXED_TIME });
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Email').fill('demo@muhasabah.local');
    await page.getByLabel('Kata sandi').fill('demo12345');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.getByTestId('prayer-list').waitFor();
    // Pastikan timer fokus tidak tersisa dari sesi sebelumnya.
    await page.evaluate(() => localStorage.removeItem('md-focus-timer'));

    for (const shot of SHOTS.filter((s) => Boolean(s.dark) === (scheme === 'dark'))) {
      await page.setViewportSize(shot.mobile ? MOBILE : DESKTOP);
      // Navigasi di dalam SPA agar tidak memanggil /auth/refresh berulang (dibatasi per menit).
      await page.evaluate((target) => {
        window.history.pushState({}, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, shot.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}${shot.name}.png` });
      console.log(`✓ ${shot.name}.png`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
