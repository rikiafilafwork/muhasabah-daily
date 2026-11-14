import { expect, test, type Page } from '@playwright/test';
import { registerViaUi } from './helpers';

/** WAV PCM hening 0,15 detik: menggantikan audio murottal agar test tidak butuh internet. */
function silentWav(seconds = 0.15, rate = 8000): Buffer {
  const samples = Math.floor(seconds * rate);
  const buf = Buffer.alloc(44 + samples);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate, 28);
  buf.writeUInt16LE(1, 32);
  buf.writeUInt16LE(8, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples, 40);
  buf.fill(128, 44);
  return buf;
}

async function stubAudio(page: Page) {
  const body = silentWav();
  await page.route('**/*.mp3', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body }),
  );
}

test('hafidz: buat rencana, dengarkan, baca sendiri, dan lanjut tahap', async ({ page }) => {
  await stubAudio(page);
  await registerViaUi(page);
  await page.goto('/memorization');
  await page.getByRole('button', { name: 'Rencana baru' }).click();
  const dialog = page.getByRole('dialog', { name: 'Rencana hafalan baru' });
  await dialog.getByLabel('Surah').click();
  await dialog.getByRole('option', { name: '112. Al-Ikhlaas (4 ayat)' }).click();
  await dialog.getByLabel('Sampai ayat').fill('2');
  await dialog.getByLabel('Dengarkan').fill('2');
  await dialog.getByLabel('Baca sendiri').fill('1');
  await dialog.getByLabel('Sambung').fill('1');
  await dialog.getByRole('button', { name: 'Buat rencana' }).click();

  await expect(page).toHaveURL(/\/memorization\/\w+/);
  const stage = page.getByTestId('stage-card');
  await expect(stage).toContainText('Dengarkan · ayat 1');
  await stage.getByRole('button', { name: 'Putar' }).click();
  await expect(stage).toContainText('Tahap selesai', { timeout: 10_000 });
  await expect(page.getByTestId('stage-counter')).toHaveText('2/2');

  await stage.getByRole('button', { name: 'Lanjut ke tahap berikutnya' }).click();
  await expect(stage).toContainText('Baca sendiri · ayat 1');
  await stage.getByLabel('Sembunyikan teks').check();
  await stage.getByRole('button', { name: /Sudah baca/ }).click();
  await expect(stage).toContainText('Tahap selesai');
  await stage.getByRole('button', { name: 'Lanjut ke tahap berikutnya' }).click();
  await expect(page.getByText('Tahap 3 dari 5')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Tahap 3 dari 5')).toBeVisible();
  await page.goto('/memorization');
  await expect(page.getByTestId('plan-card')).toContainText('40%');
});

test('hafidz: audio gagal dimuat bisa dilewati', async ({ page }) => {
  await page.route('**/*.mp3', (route) => route.fulfill({ status: 404, body: '' }));
  await registerViaUi(page);
  await page.goto('/memorization');
  await page.getByRole('button', { name: 'Rencana baru' }).click();
  const dialog = page.getByRole('dialog', { name: 'Rencana hafalan baru' });
  await dialog.getByLabel('Surah').click();
  await dialog.getByRole('option', { name: '112. Al-Ikhlaas (4 ayat)' }).click();
  await dialog.getByLabel('Sampai ayat').fill('1');
  await dialog.getByLabel('Dengarkan').fill('1');
  await dialog.getByRole('button', { name: 'Buat rencana' }).click();
  const stage = page.getByTestId('stage-card');
  await stage.getByRole('button', { name: 'Putar' }).click();
  await expect(stage).toContainText('Audio tidak bisa');
  await stage.getByRole('button', { name: 'Lewati ayat ini' }).click();
  await expect(stage).toContainText('Tahap selesai');
});

test('jurnal: simpan otomatis dan tetap ada setelah muat ulang', async ({ page }) => {
  await registerViaUi(page);
  await page.goto('/journal');
  await page.getByLabel('Muhasabah hari ini').fill('Hari ini belajar sabar saat antre panjang.');
  await expect(page.getByTestId('journal-save-status')).toHaveText('Tersimpan', { timeout: 5000 });
  await page.reload();
  await expect(page.getByLabel('Muhasabah hari ini')).toHaveValue(
    'Hari ini belajar sabar saat antre panjang.',
  );
  await expect(page.getByRole('complementary', { name: 'Jurnal sebelumnya' })).toContainText(
    'belajar sabar',
  );
  // Server E2E tidak memakai AI, jadi tombol Poles tidak ditampilkan.
  await expect(page.getByRole('button', { name: 'Poles dengan AI' })).toHaveCount(0);
});

test('kajian: tulis catatan dengan rujukan ayat lalu cari', async ({ page }) => {
  await registerViaUi(page);
  await page.goto('/lecture-notes/new');
  await page.getByLabel('Judul', { exact: true }).fill('Kajian tauhid');
  await page.getByLabel('Pemateri').fill('Ustadz Fulan');
  await page.getByLabel('Tag').fill('aqidah, tauhid');
  const editor = page.getByRole('textbox', { name: 'Isi catatan kajian' });
  await editor.click();
  await page.keyboard.type('Tauhid adalah pondasi amal.');
  await page.getByRole('button', { name: '+ Rujukan ayat' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sisipkan rujukan ayat' });
  await dialog.getByLabel('Surah').click();
  await dialog.getByRole('option', { name: '112. Al-Ikhlaas (4 ayat)' }).click();
  await dialog.getByLabel('Sampai ayat').fill('2');
  await dialog.getByRole('button', { name: 'Sisipkan' }).click();

  const refBlock = page.getByTestId('ayah-ref');
  await expect(refBlock).toContainText('QS. Al-Ikhlaas: 1–2');
  await expect(refBlock.locator('[lang="ar"]')).toHaveCount(2);

  await page.getByRole('button', { name: 'Simpan' }).click();
  await expect(page).toHaveURL(/\/lecture-notes\/\w+$/);
  await expect(page.getByTestId('note-save-status')).toContainText('Tersimpan');

  await page.goto('/lecture-notes');
  await page.getByLabel('Cari catatan').fill('pondasi');
  const list = page.getByTestId('note-list');
  await expect(list).toContainText('Kajian tauhid');
  await expect(list).toContainText('1 rujukan ayat');
  await expect(list).toContainText('#aqidah');
});
