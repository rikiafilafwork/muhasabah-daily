import { expect, test } from '@playwright/test';

import { uniqueEmail as unique } from './helpers';

test('daftar, atur lokasi, lihat waktu sholat, keluar, lalu masuk lagi', async ({ page }) => {
  const email = unique();
  const password = 'rahasia-sekali';

  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);

  await page.getByRole('link', { name: 'Daftar' }).click();
  await page.getByLabel('Nama').fill('Hamba Allah');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Daftar' }).click();

  await expect(page).toHaveURL(/\/settings\?welcome=1/);
  await expect(page.getByText('Atur lokasi agar jadwal sholat')).toBeVisible();

  await page.getByLabel('Pilih kota').selectOption('Jakarta');
  await expect(page.getByLabel('Lintang (latitude)')).toHaveValue('-6.2088');
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();

  await expect(page).toHaveURL(/\/$/);
  const list = page.getByTestId('prayer-list');
  await expect(list).toContainText('Subuh');
  await expect(list).toContainText('04.04');
  await expect(list).toContainText('Isya');
  await expect(list).toContainText('19.01');
  await expect(page.getByTestId('countdown')).toHaveText(/^\d{2}:\d{2}:\d{2}$/);

  // Sesi bertahan setelah muat ulang (refresh token di cookie httpOnly).
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hamba Allah' })).toBeVisible();

  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('heading', { name: 'Hamba Allah' })).toBeVisible();
});

test('menampilkan pesan saat kata sandi salah', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('tidak-ada@example.com');
  await page.getByLabel('Kata sandi').fill('salah-sekali');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('alert')).toContainText('Email atau kata sandi salah');
});

test('tema gelap diterapkan dan tersimpan di profil', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Nama').fill('Tema');
  await page.getByLabel('Email').fill(unique());
  await page.getByLabel('Kata sandi').fill('rahasia-sekali');
  await page.getByRole('button', { name: 'Daftar' }).click();
  await expect(page).toHaveURL(/\/settings/);

  await page.getByText('Gelap', { exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.getByText('Pengaturan tersimpan.')).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});
