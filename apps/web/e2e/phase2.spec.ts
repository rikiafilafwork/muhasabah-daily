import { expect, test } from '@playwright/test';
import { registerViaUi } from './helpers';

test.beforeEach(async ({ page }) => {
  await registerViaUi(page);
});

test('habit: tambah dari library, centang hari ini, lihat insight dan rujukan', async ({
  page,
}) => {
  await page.goto('/habits');
  await page.getByRole('button', { name: 'Tambah habit' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tambah habit' });
  await dialog.getByRole('button', { name: /^Tambah\s*:\s*Sholat Dhuha$/ }).click();
  await expect(
    dialog.getByRole('button', { name: /^Sudah ada\s*:\s*Sholat Dhuha$/ }),
  ).toBeDisabled();
  await dialog.getByRole('button', { name: 'Tutup' }).click();

  const row = page.getByTestId('habit-row').filter({ hasText: 'Sholat Dhuha' });
  await expect(row).toContainText('HR. Muslim no. 720');
  const todayCell = row.getByRole('button').last();
  await todayCell.click();
  await expect(todayCell).toHaveAttribute('aria-pressed', 'true');

  const insights = page.getByTestId('habit-insights');
  await expect(insights).toContainText('Check-in1');
  await expect(insights).toContainText('Konsistensi100%');

  // Tersinkron di beranda.
  await page.goto('/');
  await expect(page.getByRole('checkbox', { name: 'Sholat Dhuha' })).toBeChecked();
});

test('to-do: tambah cepat ke fokus, atur prioritas, selesaikan tugas', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByLabel('Tambah tugas cepat').fill('Murajaah juz 30');
  await page.keyboard.press('Enter');
  const list = page.getByTestId('task-list');
  await expect(list).toContainText('Murajaah juz 30');
  await expect(
    page.getByRole('button', { name: 'Hapus Murajaah juz 30 dari fokus hari ini' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Tugas baru' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tugas baru' });
  await dialog.getByLabel('Judul').fill('Siapkan materi kajian');
  await dialog.getByLabel('Prioritas').selectOption('high');
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(list).toContainText('Siapkan materi kajian');
  await expect(list).toContainText('Tinggi');

  await page.getByRole('checkbox', { name: 'Selesaikan Murajaah juz 30' }).check();
  await page.getByRole('button', { name: 'Selesai', exact: true }).click();
  await expect(page.getByTestId('task-list')).toContainText('Murajaah juz 30');

  await page.goto('/');
  await expect(page.getByText('Siapkan materi kajian')).toBeVisible();
});

test('goal: tautkan habit dan progres menghitung centang', async ({ page }) => {
  await page.goto('/habits');
  await page.getByRole('button', { name: 'Tambah habit' }).click();
  const lib = page.getByRole('dialog', { name: 'Tambah habit' });
  await lib.getByRole('tab', { name: 'Ibadah' }).click();
  await lib.getByRole('button', { name: /^Tambah\s*:\s*Tilawah 1 juz$/ }).click();
  await lib.getByRole('button', { name: 'Tutup' }).click();
  await page
    .getByTestId('habit-row')
    .filter({ hasText: 'Tilawah 1 juz' })
    .getByRole('button')
    .last()
    .click();

  await page.goto('/goals');
  await page.getByRole('button', { name: 'Goal baru' }).click();
  const dialog = page.getByRole('dialog', { name: 'Goal baru' });
  await dialog.getByLabel('Judul').fill('Khatam Al-Quran');
  await dialog.getByLabel('Target').fill('30');
  await dialog.getByLabel('Satuan').fill('juz');
  await dialog.getByLabel('Nilai manual').fill('2');
  await dialog.getByRole('checkbox', { name: 'Tilawah 1 juz' }).check();
  await dialog.getByRole('button', { name: 'Simpan' }).click();

  const card = page.getByTestId('goal-card').filter({ hasText: 'Khatam Al-Quran' });
  await expect(card).toContainText('3 / 30 juz');
  await expect(card).toContainText('Dari habit1');

  await card.getByRole('button', { name: 'Tambah 1 juz manual ke Khatam Al-Quran' }).click();
  await expect(card).toContainText('4 / 30 juz');
});

test('jadwal: buat agenda dan tampil di hari ini beserta waktu sholat', async ({ page }) => {
  await page.getByLabel('Pilih kota').selectOption('Jakarta');
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/schedule?view=day');
  await page.getByRole('button', { name: 'Agenda baru' }).click();
  const dialog = page.getByRole('dialog', { name: 'Agenda baru' });
  await dialog.getByLabel('Judul').fill('Kajian tafsir');
  await dialog.getByLabel('Jam mulai').fill('12:30');
  await dialog.getByLabel('Jam selesai').fill('13:30');
  await dialog.getByLabel('Lokasi (opsional)').fill('Masjid');
  await dialog.getByRole('button', { name: 'Simpan' }).click();

  const agenda = page.getByTestId('day-agenda');
  await expect(agenda).toContainText('Kajian tafsir');
  await expect(agenda).toContainText('12.30–13.30');
  await expect(agenda).toContainText('Waktu Dzuhur');
  // Urutan: Dzuhur (11.37 dari AlAdhan tiruan) sebelum kajian 12.30.
  const text = (await agenda.textContent()) ?? '';
  expect(text.indexOf('Waktu Dzuhur')).toBeLessThan(text.indexOf('Kajian tafsir'));

  await page.getByRole('button', { name: 'Minggu', exact: true }).click();
  await expect(page.getByText('Kajian tafsir')).toBeVisible();
  await page.getByRole('button', { name: 'Bulan', exact: true }).click();
  await expect(page.getByText('Kajian tafsir')).toBeVisible();
});
