import { expect, test } from '@playwright/test';

const DAILY_JAMOS = 'ㄷㅔㅇㅣㄹㄹㅣ'.split('');

test.describe('AI 제품 꼬들 production build', () => {
  test('shows how-to modal on first visit and via help button', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('ai-jamo-how-to-play-seen'));
    await page.goto('./');

    await expect(page.locator('#howto-overlay')).toBeVisible();
    await expect(page.locator('#howto-title')).toHaveText('게임 방법');
    await expect(page.locator('.howto-row .tile.correct')).toHaveCount(2);

    await page.locator('#howto-close').click();
    await expect(page.locator('#howto-overlay')).toBeHidden();

    await page.locator('#btn-howto').click();
    await expect(page.locator('#howto-overlay')).toBeVisible();
    await page.locator('#howto-close').click();
  });

  test('shows board play hint with syllable count', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
    await page.goto('./');
    await expect(page.locator('.play-hint')).toHaveText('3글자 단어를 입력하세요');
  });

  test('shows keyboard, input, and accepts daily word without jamo mismatch', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
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

  test('practice mode progressive hints from start', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
    await page.goto('./');
    await page.locator('#mode-practice').click();
    await expect(page.locator('#btn-hint')).toBeEnabled();
    await page.locator('#btn-hint').click();
    await expect(page.locator('.hint-list li')).toHaveCount(1);
    await page.locator('#btn-hint').click();
    await expect(page.locator('.hint-list li')).toHaveCount(2);
    await expect(page.locator('#btn-hint')).toContainText('1개 남음');
  });

  test('physical keyboard hangul fill submits without length error', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
    await page.goto('./');
    const input = page.locator('#guess-input');
    await input.fill('데일리');
    await input.press('Enter');
    await expect(page.locator('#message')).not.toContainText('자모 길이');
    await expect(page.locator('.tile.correct')).toHaveCount(7);
  });
});
