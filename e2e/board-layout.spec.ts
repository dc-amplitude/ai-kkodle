import { expect, test } from '@playwright/test';

/** Daily puzzle on 2026-10-15 is 환각 — 2 syllables. */
const DAILY_SYLLABLES = 2;

test('Korean board shows one big tile per syllable on each row', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./');

  await expect(page.locator('#board')).toHaveAttribute('data-syllable-count', String(DAILY_SYLLABLES));

  const rows = page.locator('#board .row');
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  for (let i = 0; i < rowCount; i++) {
    await expect(rows.nth(i).locator('.syllable-unit')).toHaveCount(DAILY_SYLLABLES);
    await expect(rows.nth(i).locator('.tile-syllable')).toHaveCount(DAILY_SYLLABLES);
  }
});

test('desktop screenshot of syllable board', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('./');
  await page.locator('[data-jamo-key="ㅎ"]').click();
  await page.locator('[data-jamo-key="ㅗ"]').click();
  await page.locator('[data-jamo-key="ㅏ"]').click();
  await page.screenshot({
    path: testInfo.outputPath('board-desktop-syllable.png'),
    fullPage: false,
  });
});

test('mobile screenshot of syllable board', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.locator('[data-jamo-key="ㅎ"]').click();
  await page.locator('[data-jamo-key="ㅗ"]').click();
  await page.screenshot({
    path: testInfo.outputPath('board-mobile-syllable.png'),
    fullPage: false,
  });
});
