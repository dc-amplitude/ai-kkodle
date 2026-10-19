import { expect, test } from '@playwright/test';
import { todayDaily } from './helpers/daily';

test('success screen shows meaning, usage, example, and etymology', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./');

  const { jamos } = todayDaily();
  for (const jamo of jamos) {
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
