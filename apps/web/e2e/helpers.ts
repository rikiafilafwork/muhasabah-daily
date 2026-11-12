import { expect, type Page } from '@playwright/test';

export const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

/** Mendaftar pengguna baru lewat UI dan berhenti di halaman pengaturan. */
export async function registerViaUi(page: Page, name = 'Penguji') {
  const email = uniqueEmail();
  await page.goto('/register');
  await page.getByLabel('Nama').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi').fill('rahasia-sekali');
  await page.getByRole('button', { name: 'Daftar' }).click();
  await expect(page).toHaveURL(/\/settings/);
  return { email, password: 'rahasia-sekali' };
}
