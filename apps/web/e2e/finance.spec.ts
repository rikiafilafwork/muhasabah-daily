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

test('keuangan: template bulanan, terapkan, bayar, dan rencana vs real', async ({ page }) => {
  await registerViaUi(page);
  await page.goto('/finance');
  const plans = page.getByTestId('finance-plans');
  await expect(plans).toContainText('Belum ada rencana');

  // Susun template
  await plans.getByRole('button', { name: 'Buat template bulanan' }).click();
  const dialog = page.getByRole('dialog');
  const addItem = async (
    type: 'Pemasukan' | 'Pengeluaran',
    name: string,
    amount: string,
    day: string,
    category: string,
  ) => {
    await dialog
      .getByRole('group', { name: 'Jenis item' })
      .getByRole('button', { name: type })
      .click();
    await dialog.getByLabel('Nama', { exact: true }).fill(name);
    await dialog.getByLabel('Nominal (Rp)').fill(amount);
    await dialog.getByLabel('Tanggal (1–31)').fill(day);
    await dialog.getByRole('combobox', { name: /Kategori/ }).click();
    await page.getByRole('option', { name: category, exact: true }).click();
    await dialog.getByRole('button', { name: 'Tambah', exact: true }).click();
    await expect(dialog.getByRole('button', { name: `Hapus ${name}` })).toBeVisible();
  };
  await addItem('Pemasukan', 'Gaji', '8000000', '1', 'Gaji');
  await addItem('Pengeluaran', 'Listrik', '400000', '1', 'Tagihan');
  await addItem('Pengeluaran', 'Internet', '300000', '1', 'Tagihan');
  await expect(dialog).toContainText('Rp 700.000');
  await page.keyboard.press('Escape');

  // Terapkan ke bulan ini
  await plans.getByRole('button', { name: 'Terapkan template (3 item)' }).click();
  await expect(page.getByText('3 rencana dari template ditambahkan')).toBeVisible();
  await expect(plans).toContainText('0 dari 3 tercatat');
  await expect(page.getByTestId('finance-expense-plan')).toContainText('Dialokasikan Rp 700.000');
  await expect(page.getByTestId('finance-expense-plan')).toContainText('Sisa Rp 700.000');

  // Bayar listrik lebih mahal dari rencana
  await plans.getByRole('button', { name: 'Bayar Listrik' }).click();
  await expect(dialog.getByLabel('Nominal dibayar (Rp)')).toHaveValue('400.000');
  await dialog.getByLabel('Nominal dibayar (Rp)').fill('462000');
  await expect(dialog).toContainText('Selisih dari rencana: +Rp 62.000');
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(dialog).toBeHidden();

  await expect(plans).toContainText('1 dari 3 tercatat');
  await expect(plans).toContainText('+Rp 62.000 dari rencana');
  await expect(page.getByTestId('finance-expense')).toHaveText('Rp 462.000');
  await expect(page.getByTestId('finance-expense-plan')).toContainText('Sisa Rp 238.000');
  await expect(page.getByRole('button', { name: /Tagihan.*Dari rencana · Listrik/ })).toBeVisible();

  // Terima gaji sesuai rencana, lalu batalkan
  await plans.getByRole('button', { name: 'Terima Gaji' }).click();
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByTestId('finance-income')).toHaveText('Rp 8.000.000');
  await expect(page.getByTestId('finance-income-plan')).toContainText('Sesuai rencana');
  await plans.getByRole('button', { name: 'Batalkan catatan Gaji' }).click();
  await expect(page.getByTestId('finance-income')).toHaveText('Rp 0');
  await expect(plans).toContainText('1 dari 3 tercatat');

  // Menerapkan ulang tidak menggandakan
  await page.getByRole('button', { name: 'Bulan berikutnya' }).click();
  await plans.getByRole('button', { name: 'Terapkan template (3 item)' }).click();
  await expect(plans).toContainText('0 dari 3 tercatat');
  await page.getByRole('button', { name: 'Bulan sebelumnya' }).click();
  await expect(plans).toContainText('1 dari 3 tercatat');
});
