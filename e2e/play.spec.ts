import { expect, test } from '@playwright/test';

const DAILY_JAMOS = 'ㄷㅔㅇㅣㄹㄹㅣ'.split('');

test.describe('AI 제품 꼬들 production build', () => {
  test('shows keyboard, input, and accepts daily word without jamo mismatch', async ({ page }) => {
    await page.goto('./');

    await expect(page.locator('.keyboard')).toBeVisible();
    await expect(page.locator('#guess-input')).toBeVisible();
    await expect(page.locator('.input-hint')).toContainText('자모 키보드');

    await page.locator('#board').click();
    await expect(page.locator('#guess-input')).toBeFocused();

    for (const jamo of DAILY_JAMOS.slice(0, 6)) {
      await page.locator(`[data-jamo-key="${jamo}"]`).click();
    }

    await expect(page.locator('.draft-preview')).toContainText('6/7');
    await page.locator('[data-jamo-key="ㅣ"]').click();
    await expect(page.locator('.draft-preview')).toContainText('7/7');

    await page.locator('[data-action="enter"]').click();

    await expect(page.locator('#message')).not.toContainText('자모 길이');
    await expect(page.locator('.row').first().locator('.tile.correct')).not.toHaveCount(0);
  });

  test('physical keyboard hangul fill submits without length error', async ({ page }) => {
    await page.goto('./');
    const input = page.locator('#guess-input');
    await input.fill('데일리');
    await input.press('Enter');
    await expect(page.locator('#message')).not.toContainText('자모 길이');
    await expect(page.locator('.tile.correct')).toHaveCount(7);
  });
});
