import { expect, test } from '@playwright/test';
import { registerViaUi } from './helpers';

test('dzikir: hitung, tuntas, dan tersimpan setelah muat ulang', async ({ page }) => {
  await registerViaUi(page);
  await page.goto('/dhikr?group=pagi');

  const kursi = page.getByTestId('dhikr-card').filter({ hasText: 'Ayat Kursi' });
  await expect(kursi).toContainText('Rujukan:');
  await kursi.getByRole('button', { name: /Hitung Ayat Kursi/ }).click();
  await expect(kursi.getByRole('button', { name: /Ayat Kursi tuntas/ })).toBeDisabled();

  const ikhlas = page.getByTestId('dhikr-card').filter({ hasText: 'Surah Al-Ikhlas' });
  const btn = ikhlas.getByRole('button', { name: /Hitung Surah Al-Ikhlas/ });
  await btn.click();
  await btn.click();
  await expect(ikhlas).toContainText('2 / 3');
  await expect(page.getByTestId('dhikr-progress')).toContainText(/1\/\d+ tuntas/);
  await expect(page.getByTestId('dhikr-sync-status')).toHaveText('Tersimpan');

  await page.reload();
  await expect(page.getByTestId('dhikr-card').filter({ hasText: 'Surah Al-Ikhlas' })).toContainText(
    '2 / 3',
  );

  await page.goto('/');
  await expect(page.getByRole('link', { name: /Dzikir pagi/ })).toContainText(/1\/\d+/);
});

test('dzikir: hitungan saat offline diantre lalu terkirim saat online', async ({
  page,
  context,
}) => {
  await registerViaUi(page);
  await page.goto('/dhikr?group=petang');
  const card = page.getByTestId('dhikr-card').filter({ hasText: 'Tasbih dan tahmid' });
  const btn = card.getByRole('button', { name: /Hitung Tasbih dan tahmid/ });
  await expect(btn).toBeVisible();

  await context.setOffline(true);
  for (let i = 0; i < 5; i++) await btn.click();
  await expect(card).toContainText('5 / 100');
  await expect(page.getByTestId('dhikr-sync-status')).toContainText('Offline');

  await context.setOffline(false);
  await expect(page.getByTestId('dhikr-sync-status')).toHaveText('Tersimpan');
  await page.reload();
  await expect(
    page.getByTestId('dhikr-card').filter({ hasText: 'Tasbih dan tahmid' }),
  ).toContainText('5 / 100');
});

test('fokus: sesi 25 menit selesai otomatis dan tercatat', async ({ page }) => {
  await page.clock.install();
  await registerViaUi(page);
  await page.goto('/focus');
  await expect(page.getByTestId('focus-remaining')).toHaveText('25:00');

  await page.getByRole('button', { name: 'Mulai' }).click();
  await page.clock.fastForward('10:00');
  await expect(page.getByTestId('focus-remaining')).toHaveText('15:00');

  // Jeda tidak mengurangi sisa waktu.
  await page.getByRole('button', { name: 'Jeda' }).click();
  await page.clock.fastForward('05:00');
  await expect(page.getByTestId('focus-remaining')).toHaveText('15:00');
  await page.getByRole('button', { name: 'Lanjutkan' }).click();

  await page.clock.fastForward('15:01');
  await expect(page.getByText('25 menit fokus tercatat')).toBeVisible();
  await expect(page.getByTestId('focus-today-minutes')).toHaveText('25');
  await expect(page.getByRole('button', { name: 'Istirahat', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
