import { expect, test } from '@playwright/test';

test('English puzzle: QWERTY, badge, win LLM', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./?mode=practice&practiceSeed=57');

  await expect(page.locator('.origin-badge')).toContainText('영어 정답');
  await expect(page.locator('.play-hint')).toContainText('3글자');
  await expect(page.locator('.keyboard-qwerty')).toBeVisible();

  for (const ch of ['L', 'L', 'M']) {
    await page.locator(`[data-latin-key="${ch}"]`).click();
  }
  await page.locator('[data-action="enter"]').click();
  await expect(page.locator('.definition .def-label')).toHaveCount(3);
  await expect(page.locator('.definition')).toContainText('어원');
  await expect(page.locator('.def-example')).toContainText('예:');

  await page.screenshot({
    path: testInfo.outputPath('english-llm-win.png'),
    fullPage: false,
  });
});

test('English puzzle rejects Hangul in input', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./?mode=practice&practiceSeed=57');
  await expect(page.locator('.origin-badge')).toContainText('영어 정답');

  const input = page.locator('#guess-input');
  await input.click();
  await input.fill('GPU가');
  await expect(page.locator('#input-message')).toContainText('A–Z');
});

test('Korean daily uses jamo keyboard', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
  await page.goto('./');
  await expect(page.locator('.origin-badge')).toContainText('한글 정답');
  await expect(page.locator('.keyboard-qwerty')).toHaveCount(0);
  await expect(page.locator('[data-jamo-key="ㄱ"]')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('korean-daily-hallucination.png'),
    fullPage: false,
  });
});
