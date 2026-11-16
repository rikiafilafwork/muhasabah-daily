import { expect, test } from '@playwright/test';
import { registerViaUi } from './helpers';

test('keuangan: catat pemasukan dan pengeluaran, ringkasan bulan ini berubah', async ({ page }) => {
  await registerViaUi(page);
  await page.goto('/finance');
  await expect(page.getByRole('heading', { name: 'Keuangan', level: 1 })).toBeVisible();
  await expect(page.getByText(/Belum ada transaksi/)).toBeVisible();

  // Pemasukan
  await page.getByRole('button', { name: 'Catat pemasukan' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Pemasukan' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await dialog.getByLabel('Nominal (Rp)').fill('5000000');
  await expect(dialog.getByLabel('Nominal (Rp)')).toHaveValue('5.000.000');
  await dialog.getByLabel('Catatan (opsional)').fill('Gaji November');
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('finance-income')).toHaveText('Rp 5.000.000');

  // Pengeluaran dengan kategori lain
  await page.getByRole('button', { name: 'Catat', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Pengeluaran' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await dialog.getByLabel('Nominal (Rp)').fill('Rp 75.500');
  await dialog.getByRole('combobox', { name: 'Kategori' }).click();
  await page.getByRole('option', { name: 'Transportasi' }).click();
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByTestId('finance-expense')).toHaveText('Rp 75.500');
  await expect(page.getByTestId('finance-balance')).toHaveText('Rp 4.924.500');
  await expect(page.getByRole('button', { name: /Transportasi.*−Rp 75\.500/ })).toBeVisible();

  // Validasi: nominal kosong ditolak di klien
  await page.getByRole('button', { name: 'Catat', exact: true }).click();
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(dialog.getByText('Nominal wajib diisi')).toBeVisible();
  await page.keyboard.press('Escape');

  // Ubah lalu hapus
  await page.getByRole('button', { name: /Transportasi.*−Rp 75\.500/ }).click();
  await dialog.getByLabel('Nominal (Rp)').fill('100000');
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByTestId('finance-expense')).toHaveText('Rp 100.000');
  await page.getByRole('button', { name: /Transportasi.*−Rp 100\.000/ }).click();
  await dialog.getByRole('button', { name: 'Hapus' }).click();
  await expect(page.getByTestId('finance-expense')).toHaveText('Rp 0');

  // Bulan lalu kosong; beranda menampilkan ringkasan
  await page.getByRole('button', { name: 'Bulan sebelumnya' }).click();
  await expect(page).toHaveURL(/month=\d{4}-\d{2}/);
  await expect(page.getByTestId('finance-income')).toHaveText('Rp 0');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Keuangan bulan ini' })).toBeVisible();
});

test('keuangan: tambah kategori sendiri', async ({ page }) => {
  await registerViaUi(page);
  await page.goto('/finance');
  await page.getByRole('button', { name: 'Kategori', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Gaji')).toBeVisible();
  await dialog.getByLabel('Nama kategori').fill('Kopi');
  await dialog.getByRole('button', { name: 'Tambah' }).click();
  await expect(dialog.getByRole('button', { name: 'Hapus Kopi' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Arsipkan Kopi' }).click();
  await expect(dialog.getByRole('button', { name: 'Pulihkan Kopi' })).toBeVisible();
});
