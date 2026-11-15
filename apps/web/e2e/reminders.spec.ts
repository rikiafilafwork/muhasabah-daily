import { expect, test } from '@playwright/test';
import { registerViaUi } from './helpers';

test('pengingat: pilih sholat di pengaturan dan pengingat per agenda', async ({ page }) => {
  await registerViaUi(page);

  const card = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Pengingat', exact: true }) });
  // Sebelum lokasi diatur, pilihan sholat dinonaktifkan.
  await expect(card.getByRole('checkbox', { name: 'Subuh' })).toBeDisabled();

  await page.getByLabel('Pilih kota').click();
  await page.getByRole('option', { name: 'Jakarta' }).click();
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/settings');
  // Server dev tanpa service worker: tombol aktifkan tidak ditawarkan.
  await expect(card).toContainText('Service worker belum aktif');
  await card.getByRole('checkbox', { name: 'Subuh' }).check();
  await card.getByRole('checkbox', { name: 'Isya' }).check();
  await expect(card.getByRole('checkbox', { name: 'Isya' })).toBeEnabled();

  await page.reload();
  await expect(card.getByRole('checkbox', { name: 'Subuh' })).toBeChecked();
  await expect(card.getByRole('checkbox', { name: 'Isya' })).toBeChecked();
  await expect(card.getByRole('checkbox', { name: 'Dzuhur' })).not.toBeChecked();

  await page.goto('/schedule?view=day');
  await page.getByRole('button', { name: 'Agenda baru' }).click();
  const dialog = page.getByRole('dialog', { name: 'Agenda baru' });
  await dialog.getByLabel('Judul').fill('Kajian tafsir');
  await dialog.getByLabel('Pengingat').click();
  await dialog.getByRole('option', { name: '30 menit sebelumnya' }).click();
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(dialog).toBeHidden();

  await page
    .getByRole('button', { name: /Kajian tafsir/ })
    .first()
    .click();
  const edit = page.getByRole('dialog', { name: 'Ubah agenda' });
  await expect(edit.getByLabel('Pengingat')).toContainText('30 menit sebelumnya');
});
