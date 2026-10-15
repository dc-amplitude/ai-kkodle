import { expect, test } from '@playwright/test';

async function skipHowTo(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
}

/** DOM-level composition sequence (WebKit + fallback). */
async function composeHangulWord(
  page: import('@playwright/test').Page,
  word: string,
): Promise<void> {
  const input = page.locator('#guess-input');
  await input.click();
  await page.evaluate(async (w) => {
    const el = document.querySelector('#guess-input') as HTMLInputElement;
    el.focus();
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    for (const ch of w) {
      el.value += ch;
      el.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          inputType: 'insertCompositionText',
          data: ch,
        }),
      );
    }
    el.dispatchEvent(
      new CompositionEvent('compositionend', { bubbles: true, data: el.value }),
    );
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: w }));
  }, word);
}

test.describe('Korean IME composition', () => {
  test.beforeEach(async ({ page }) => {
    await skipHowTo(page);
    await page.goto('./');
  });

  test('does not rewrite value mid-composition (multi-syllable)', async ({ page }) => {
    const input = page.locator('#guess-input');
    await input.click();

    await page.evaluate(() => {
      const el = document.querySelector('#guess-input') as HTMLInputElement;
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
      el.value = '환';
      el.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: '환' }),
      );
    });
    await expect(input).toHaveValue('환');

    await page.evaluate(() => {
      const el = document.querySelector('#guess-input') as HTMLInputElement;
      el.value = '환';
      el.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: '환' }),
      );
    });
    await expect(input).toHaveValue('환');

    await page.evaluate(() => {
      const el = document.querySelector('#guess-input') as HTMLInputElement;
      el.value = '환각';
      el.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '환각' }),
      );
      el.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType: 'insertFromComposition', data: '환각' }),
      );
    });

    await expect(input).toHaveValue('환각');
    const end = await input.evaluate((el) => ({
      start: el.selectionStart,
      end: el.selectionEnd,
      len: el.value.length,
    }));
    expect(end.start).toBe(end.len);
    expect(end.end).toBe(end.len);
  });

  test('keyboard jamos assemble syllables live (ㄱㅏㄴ -> 간)', async ({ page }) => {
    await page.locator('#mode-practice').click();
    for (const key of ['ㄱ', 'ㅏ', 'ㄴ']) {
      await page.locator(`[data-jamo-key="${key}"]`).click();
    }
    await expect(page.locator('#guess-input')).toHaveValue('간');
  });
});

test.describe('Chromium CDP IME', () => {
  test('imeSetComposition sequence', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP IME API is Chromium-only');
    await skipHowTo(page);
    await page.goto('./');
    const client = await page.context().newCDPSession(page);
    const input = page.locator('#guess-input');
    await input.click();

    await client.send('Input.imeSetComposition', {
      text: '환',
      selectionStart: 1,
      selectionEnd: 1,
      replacementStart: 0,
      replacementEnd: 0,
    });
    await page.evaluate(() => {
      const el = document.querySelector('#guess-input') as HTMLInputElement;
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
      el.value = '환';
      el.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: '환' }),
      );
    });
    await expect(input).toHaveValue('환');

    await client.send('Input.imeSetComposition', {
      text: '환각',
      selectionStart: 2,
      selectionEnd: 2,
      replacementStart: 0,
      replacementEnd: 1,
    });
    await page.evaluate(() => {
      const el = document.querySelector('#guess-input') as HTMLInputElement;
      el.value = '환각';
      el.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '환각' }),
      );
      el.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType: 'insertFromComposition', data: '환각' }),
      );
    });
    await expect(input).toHaveValue('환각');
  });
});

test('WebKit compositionend commits full word', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'WebKit-specific project');
  await skipHowTo(page);
  await page.goto('./');
  await composeHangulWord(page, '환각');
  await expect(page.locator('#guess-input')).toHaveValue('환각');
});
