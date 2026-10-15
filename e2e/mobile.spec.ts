import { expect, test } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { width: 390, height: 844, label: '390x844' },
  { width: 360, height: 740, label: '360x740' },
];

for (const vp of MOBILE_VIEWPORTS) {
  test(`touch layout fits without page scroll (${vp.label})`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('./');

    await expect(page.locator('html')).toHaveClass(/device-touch/);

    const verticalOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollHeight > doc.clientHeight + 2;
    });
    expect(verticalOverflow, 'no vertical page scroll').toBe(false);

    await expect(page.locator('.board')).toBeVisible();
    await expect(page.locator('.keyboard')).toBeVisible();
  });
}

test('does not auto-focus input or open IME path on touch load', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./');

  await expect(page.locator('html')).toHaveClass(/device-touch/);
  await expect(page.locator('#guess-input')).not.toBeFocused();
  await expect(page.locator('#guess-input')).toHaveAttribute('readonly', '');
  await expect(page.locator('#guess-input')).toHaveAttribute('inputmode', 'none');
});

test('board tap does not focus input on touch; jamo keys still work', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./');

  await page.locator('#board').click();
  await expect(page.locator('#guess-input')).not.toBeFocused();

  for (const jamo of 'ㄷㅔㅇㅣㄹ'.split('')) {
    await page.locator(`[data-jamo-key="${jamo}"]`).click();
  }
  await expect(page.locator('.draft-preview')).toContainText('5/7');
});

test('mobile IME toggle enables phone keyboard input mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./');

  await page.locator('#btn-mobile-ime').click();
  await expect(page.locator('#guess-input')).toBeFocused();
  await expect(page.locator('#guess-input')).not.toHaveAttribute('readonly');
  await expect(page.locator('#guess-input')).toHaveAttribute('inputmode', 'text');
  await expect(page.locator('#btn-mobile-ime')).toContainText('자모 키보드로 입력');
});

test('native keyboard open hides on-screen keyboard', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./');

  await page.locator('#btn-mobile-ime').click();

  await page.evaluate(() => {
    const vv = window.visualViewport!;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
    Object.defineProperty(vv, 'height', { configurable: true, value: 420 });
    Object.defineProperty(vv, 'offsetTop', { configurable: true, value: 0 });
    vv.dispatchEvent(new Event('resize'));
  });

  await expect(page.locator('html')).toHaveClass(/native-kb-open/);
  await expect(page.locator('.keyboard')).toBeHidden();
});

test('mobile gameplay screenshot', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.locator('[data-jamo-key="ㄷ"]').click();
  await page.locator('[data-jamo-key="ㅔ"]').click();
  await page.screenshot({
    path: testInfo.outputPath(`${testInfo.project.name}-390x844.png`),
    fullPage: false,
  });
});
