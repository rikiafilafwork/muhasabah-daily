import { expect, test, type Page } from '@playwright/test';

/**
 * Di layar 390 px tidak boleh ada elemen yang meluber keluar viewport, kecuali di
 * dalam wadah yang memang bisa digulir mendatar (mis. grid habit).
 */
const PAGES = [
  '/',
  '/schedule?view=week',
  '/schedule?view=month',
  '/schedule?view=day',
  '/tasks',
  '/habits',
  '/goals',
  '/focus',
  '/dhikr?group=pagi',
  '/memorization',
  '/journal',
  '/lecture-notes',
  '/lecture-notes/new',
  '/settings',
];

test.use({ viewport: { width: 390, height: 844 } });

async function overflowing(page: Page) {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth + 1;
    const scrollable = (el: Element | null): boolean => {
      for (let e = el?.parentElement; e && e !== document.body; e = e.parentElement) {
        const ox = getComputedStyle(e).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
      }
      return false;
    };
    return [...document.querySelectorAll('main *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > limit && !el.closest('.sr-only') && !scrollable(el);
      })
      .slice(0, 5)
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 4).join('.')} → ${Math.round(el.getBoundingClientRect().right)}px`,
      );
  });
}

test('tidak ada konten meluber di layar 390 px', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@muhasabah.local');
  await page.getByLabel('Kata sandi').fill('demo12345');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByTestId('prayer-list')).toBeVisible();

  const found: Record<string, string[]> = {};
  for (const url of PAGES) {
    await page.evaluate((target) => {
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    const bad = await overflowing(page);
    if (bad.length) found[url] = bad;
  }
  expect(found).toEqual({});
});

test('landing page tidak meluber di layar 390 px', async ({ page }) => {
  await page.goto('/welcome');
  await page.waitForLoadState('networkidle');
  expect(await overflowing(page)).toEqual([]);
});
