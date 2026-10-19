import { expect, test } from '@playwright/test';

async function gotoPracticeTwoSyllables(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('./?mode=practice');
  for (let i = 0; i < 80; i++) {
    const n = await page.locator('#board').getAttribute('data-syllable-count');
    if (n === '2') return;
    await page.locator('#btn-new').click();
  }
  throw new Error('Could not find a 2-syllable practice puzzle');
}

async function typeBabo(page: import('@playwright/test').Page): Promise<void> {
  for (const key of ['ㅂ', 'ㅏ', 'ㅂ', 'ㅗ']) {
    await page.locator(`[data-jamo-key="${key}"]`).click();
  }
}

test('preview row splits 바보 into two syllable tiles', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await gotoPracticeTwoSyllables(page);

  await typeBabo(page);

  const slots = page.locator('#board-preview .syllable-preview-slot');
  await expect(slots).toHaveCount(2);
  await expect(slots.nth(0).locator('.tile-syllable')).toHaveText('바');
  await expect(slots.nth(1).locator('.tile-syllable')).toHaveText('보');
});

test('guess rows are jamo-only with syllable groups', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await gotoPracticeTwoSyllables(page);

  const row = page.locator('#board-guesses .row').first();
  await expect(row.locator('.tile-syllable')).toHaveCount(0);
  await expect(row.locator('.syl-group')).toHaveCount(2);
});

test('desktop screenshot mid-typing 바보', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoPracticeTwoSyllables(page);
  await typeBabo(page);
  await page.screenshot({
    path: testInfo.outputPath('board-desktop-mid-babo.png'),
    fullPage: false,
  });
});

test('mobile screenshot mid-typing 바보', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoPracticeTwoSyllables(page);
  await typeBabo(page);

  const box = await page.locator('#board-preview .tile-preview').first().boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(Math.abs(box.width - box.height)).toBeLessThan(4);
  }

  await page.screenshot({
    path: testInfo.outputPath('board-mobile-mid-babo.png'),
    fullPage: false,
  });
});

test('desktop preview tiles are large squares', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoPracticeTwoSyllables(page);
  await typeBabo(page);
  const box = await page.locator('#board-preview .tile-preview').first().boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(60);
    expect(box.height).toBeGreaterThanOrEqual(60);
    expect(Math.abs(box.width - box.height)).toBeLessThan(4);
  }
});

test('desktop screenshot after one submitted guess', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoPracticeTwoSyllables(page);
  await typeBabo(page);
  await page.locator('[data-action="enter"]').click();
  await expect(page.locator('#board-guesses .row').first().locator('.tile-jamo')).not.toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('board-desktop-after-submit.png'),
    fullPage: false,
  });
});

test('mobile screenshot after one submitted guess', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoPracticeTwoSyllables(page);
  await typeBabo(page);
  await page.locator('[data-action="enter"]').click();
  await page.screenshot({
    path: testInfo.outputPath('board-mobile-after-submit.png'),
    fullPage: false,
  });
});
