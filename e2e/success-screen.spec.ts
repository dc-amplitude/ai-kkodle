import { expect, test } from '@playwright/test';

/** Daily puzzle on 2026-10-15 (Seoul) is 환각 — 6 jamos. */
const WORD = '환각';
const JAMOS = 'ㅎㅗㅏㄴㄱㅏㄱ'.split('');

test('success screen shows meaning, usage, example, and etymology', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./');

  for (const jamo of JAMOS) {
    await page.locator(`[data-jamo-key="${jamo}"]`).click();
  }
  await page.locator('[data-action="enter"]').click();

  await expect(page.locator('.definition .def-label').first()).toHaveText('의미');
  await expect(page.locator('.definition')).toContainText('어원');
  await expect(page.locator('.def-example')).toContainText('예:');
  await expect(page.locator('.def-line').first()).not.toBeEmpty();

  await page.screenshot({
    path: testInfo.outputPath('success-hallucination.png'),
    fullPage: false,
  });
});
