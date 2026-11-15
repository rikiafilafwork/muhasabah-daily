import { expect, test } from '@playwright/test';
import { registerViaUi } from './helpers';

// Build produksi: service worker aktif dan menyimpan data API untuk dibuka offline.
test.use({ baseURL: 'http://localhost:5175' });

test('offline: aplikasi tetap terbuka dengan data terakhir, perubahan ditahan', async ({
  page,
  context,
}) => {
  await registerViaUi(page);
  // Service worker mengambil alih halaman (clientsClaim) tanpa perlu muat ulang.
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 })
    .toBe(true);

  await page.goto('/tasks');
  await page.getByLabel('Tambah tugas cepat').fill('Baca Al-Kahfi');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('task-list')).toContainText('Baca Al-Kahfi');
  // Muat sekali lagi agar daftar tugas terbaru tersimpan di cache.
  await page.reload();
  await expect(page.getByTestId('task-list')).toContainText('Baca Al-Kahfi');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: 'Sedang offline' })).toBeVisible();
  await expect(page.getByTestId('task-list')).toContainText('Baca Al-Kahfi');

  await page.getByLabel('Tambah tugas cepat').fill('Tidak tersimpan');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Kamu sedang offline. Perubahan belum bisa disimpan')).toBeVisible();

  // Tersambung lagi: sesi diverifikasi ulang dan perubahan bisa disimpan.
  await context.setOffline(false);
  await expect(page.getByRole('status').filter({ hasText: 'Sedang offline' })).toBeHidden();
  await page.getByLabel('Tambah tugas cepat').fill('Murajaah');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('task-list')).toContainText('Murajaah');
});
