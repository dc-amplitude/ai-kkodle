import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { width: 360, height: 640, name: 'mobile-narrow' },
  { width: 390, height: 844, name: 'mobile-standard' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1280, height: 800, name: 'desktop' },
  { width: 1920, height: 1080, name: 'desktop-wide' },
];

for (const vp of VIEWPORTS) {
  test(`layout fits at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('./');

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });
    expect(overflow, 'no horizontal scroll').toBe(false);

    await expect(page.locator('.board')).toBeVisible();
    await expect(page.locator('.keyboard')).toBeVisible();

    const boardBox = await page.locator('.board').boundingBox();
    const kbBox = await page.locator('.keyboard').boundingBox();
    expect(boardBox).not.toBeNull();
    expect(kbBox).not.toBeNull();
    if (boardBox && kbBox) {
      expect(boardBox.x + boardBox.width).toBeLessThanOrEqual(vp.width + 1);
      expect(kbBox.x + kbBox.width).toBeLessThanOrEqual(vp.width + 1);
    }

    const minKeyWidth = await page.locator('.kb-key').first().evaluate((el) => el.getBoundingClientRect().width);
    if (vp.width <= 390) {
      expect(minKeyWidth).toBeGreaterThanOrEqual(28);
    }
  });
}

test('wide jamo board scales tiles on small viewport', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('./');
  await page.locator('#mode-practice').click();
  await page.locator('#btn-new').click();

  const jamoCount = await page.locator('.board').getAttribute('data-jamo-count');
  expect(Number(jamoCount)).toBeGreaterThan(0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(overflow).toBe(true);
});
