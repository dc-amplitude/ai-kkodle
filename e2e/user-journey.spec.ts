import { expect, test } from '@playwright/test';
import { todayDaily, wrongGuessesForDaily } from './helpers/daily';

async function skipHowTo(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('ai-jamo-how-to-play-seen', '1'));
}

/** Commit one Hangul syllable (Android Gboard-style per-syllable composition). */
async function commitSyllableViaIme(
  page: import('@playwright/test').Page,
  prior: string,
  syllable: string,
): Promise<void> {
  await page.evaluate(
    ({ priorValue, syl }) => {
      const el = document.querySelector('#guess-input') as HTMLInputElement;
      el.focus();
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
      const next = priorValue + syl;
      el.value = next;
      el.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          inputType: 'insertCompositionText',
          data: syl,
          isComposing: true,
        } as InputEventInit),
      );
      el.dispatchEvent(
        new CompositionEvent('compositionupdate', { bubbles: true, data: syl }),
      );
      el.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: next }),
      );
      el.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          inputType: 'insertFromComposition',
          data: syl,
          isComposing: false,
        } as InputEventInit),
      );
    },
    { priorValue: prior, syl: syllable },
  );
}

test.describe('User journeys — visible UI', () => {
  test.beforeEach(async ({ page }) => {
    await skipHowTo(page);
  });

  test('on-screen jamo keyboard: live tiles, submit, correct colors', async ({ page }) => {
    const daily = todayDaily();
    await page.goto('./');
    for (const jamo of daily.jamos) {
      await page.locator(`[data-jamo-key="${jamo}"]`).click();
    }
    const syllables = [...daily.word.replace(/\s/g, '')];
    for (let i = 0; i < syllables.length; i++) {
      await expect(page.locator('#board-preview .tile-syllable').nth(i)).toHaveText(syllables[i]!);
    }
    await expect(page.locator('.draft-preview')).toContainText(
      `${daily.jamoCount}/${daily.jamoCount}`,
    );

    await page.locator('[data-action="enter"]').click();
    await expect(page.locator('#board-guesses .row').first().locator('.tile-jamo.correct')).not.toHaveCount(
      0,
    );
    await expect(page.locator('#message')).not.toContainText('자모 길이');
  });

  test('QWERTY fallback converts to Hangul and fills preview', async ({ page }) => {
    const daily = todayDaily();
    await page.goto('./');
    const input = page.locator('#guess-input');
    await input.click();
    await input.fill('xptmxm');
    await input.evaluate((el) => el.dispatchEvent(new Event('input', { bubbles: true })));
    await expect(input).toHaveValue(daily.word);
    const syllables = [...daily.word.replace(/\s/g, '')];
    for (let i = 0; i < syllables.length; i++) {
      await expect(page.locator('#board-preview .tile-syllable').nth(i)).toHaveText(syllables[i]!);
    }
  });

  test('backspace mid-syllable on jamo keyboard updates preview', async ({ page }) => {
    await page.goto('./');
    for (const jamo of ['ㄱ', 'ㅏ']) {
      await page.locator(`[data-jamo-key="${jamo}"]`).click();
    }
    await expect(page.locator('#guess-input')).toHaveValue('가');
    await page.locator('[data-action="backspace"]').click();
    await expect(page.locator('#guess-input')).toHaveValue('ㄱ');
    await expect(page.locator('#board-preview .tile-syllable').first()).toHaveText('');
    const jamoCap = await page.locator('#board').getAttribute('data-jamo-count');
    await expect(page.locator('.draft-preview')).toContainText(`1/${jamoCap}`);
  });

  test('Android-style per-syllable IME shows each syllable in preview before next compose', async ({
    page,
  }) => {
    const daily = todayDaily();
    const chars = [...daily.word.replace(/\s/g, '')];
    await page.goto('./');
    const input = page.locator('#guess-input');
    await input.click();
    let prior = '';
    for (let i = 0; i < chars.length; i++) {
      const syl = chars[i]!;
      await commitSyllableViaIme(page, prior, syl);
      await expect(page.locator('#board-preview .tile-syllable').nth(i)).toHaveText(syl);
      await expect(page.locator('.draft-preview')).toContainText(syl);
      prior += syl;
    }
    await expect(input).toHaveValue(daily.word);
  });

  test('desktop IME mid-composition: second syllable visible before compositionend', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(browserName !== 'chromium', 'CDP + DOM IME journey runs on Chromium desktop');
    await page.goto('./');
    const input = page.locator('#guess-input');
    await input.click();

    await commitSyllableViaIme(page, '', '가');

    await page.evaluate(() => {
      const el = document.querySelector('#guess-input') as HTMLInputElement;
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
      el.value = '가연';
      el.dispatchEvent(
        new CompositionEvent('compositionupdate', { bubbles: true, data: '연' }),
      );
      el.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          inputType: 'insertCompositionText',
          data: '연',
          isComposing: true,
        } as InputEventInit),
      );
    });

    await expect(page.locator('#board-preview .tile-syllable').nth(0)).toHaveText('가');
    await expect(page.locator('#board-preview .tile-syllable').nth(1)).toHaveText('연');
    await expect(page.locator('.draft-preview')).toContainText('가연');
    const jamoCap = await page.locator('#board').getAttribute('data-jamo-count');
    await expect(page.locator('.draft-preview')).toContainText(new RegExp(`/${jamoCap}`));

    const activeRow = page.locator('#board-guesses .row').first();
    await expect(activeRow.locator('.tile-jamo.tbd')).toHaveCount(5);

    await page.screenshot({
      path: '/opt/cursor/artifacts/screenshots/ime-mid-composition-preview.png',
      fullPage: false,
    });

    await page.evaluate(() => {
      const el = document.querySelector('#guess-input') as HTMLInputElement;
      el.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '가연' }),
      );
      el.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          inputType: 'insertFromComposition',
          data: '연',
          isComposing: false,
        } as InputEventInit),
      );
    });
    await expect(input).toHaveValue('가연');
    await expect(page.locator('#board-preview .tile-syllable').nth(1)).toHaveText('연');
  });

  test('win flow: daily answer shows success definition', async ({ page }) => {
    const daily = todayDaily();
    await page.goto('./');
    for (const jamo of daily.jamos) {
      await page.locator(`[data-jamo-key="${jamo}"]`).click();
    }
    await page.locator('[data-action="enter"]').click();
    await expect(page.locator('.definition .def-label').first()).toHaveText('의미');
    await expect(page.locator('.definition')).toContainText('어원');
  });

  test('lose flow: six wrong guesses reveal answer', async ({ page }) => {
    const daily = todayDaily();
    await page.goto('./');
    const wrong = wrongGuessesForDaily(6);
    expect(wrong.length).toBe(6);
    for (const word of wrong) {
      await page.locator('#guess-input').fill(word);
      await page.locator('#guess-input').evaluate((el) =>
        el.dispatchEvent(new Event('input', { bubbles: true })),
      );
      await page.locator('[data-action="enter"]').click();
    }
    await expect(page.locator('.fail')).toContainText(daily.word);
    await expect(page.locator('#guess-input')).toBeDisabled();
  });

  test('English practice: QWERTY keys and win tiles', async ({ page }) => {
    await page.goto('./?mode=practice&practiceSeed=57');
    await expect(page.locator('.keyboard-qwerty')).toBeVisible();
    for (const ch of ['L', 'L', 'M']) {
      await page.locator(`[data-latin-key="${ch}"]`).click();
    }
    await expect(page.locator('#board-preview .tile-syllable').nth(0)).toHaveText('L');
    await page.locator('[data-action="enter"]').click();
    await expect(page.locator('.definition')).toContainText('어원');
  });
});
