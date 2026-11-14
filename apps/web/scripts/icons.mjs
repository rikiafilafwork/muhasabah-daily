/**
 * Membuat ikon PWA (PNG) dari public/favicon.svg memakai Chromium (Playwright).
 * Pemakaian: pnpm --filter web icons
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const svg = await readFile(`${root}favicon.svg`, 'utf8');
const crescent = svg.match(/<path[^>]*\/>/)?.[0] ?? '';

/** any: ikon apa adanya. maskable: latar penuh + simbol diperkecil agar tetap di zona aman. */
const variants = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
];

const browser = await chromium.launch();
try {
  for (const v of variants) {
    const page = await browser.newPage({
      viewport: { width: v.size, height: v.size },
      deviceScaleFactor: 1,
    });
    const body = v.maskable
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${v.size}" height="${v.size}"><rect width="32" height="32" fill="#047857"/><g transform="translate(2.4 2.4) scale(0.85)">${crescent}</g></svg>`
      : svg.replace('<svg ', `<svg width="${v.size}" height="${v.size}" `);
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${body}</body></html>`,
    );
    await page.screenshot({
      path: `${root}icons/${v.file}`,
      omitBackground: !v.maskable,
      clip: { x: 0, y: 0, width: v.size, height: v.size },
    });
    await page.close();
    console.log(`✓ icons/${v.file}`);
  }
} finally {
  await browser.close();
}
