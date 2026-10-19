import { expect, test } from '@playwright/test';
import {
  groupedPreviewForAnswer,
  groupedPreviewForDailyGuess,
  todayDaily,
  wrongGuessesForDaily,
} from './helpers/daily';

/** Practice puzzle with answer 테스트 ([2][2][2] jamo groups). */
const PRACTICE_TEST_URL = './?mode=practice&practiceSeed=38';
const ANSWER_TEST = '테스트';

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
    const tiles = groupedPreviewForDailyGuess(daily.word);
    for (let i = 0; i < tiles.length; i++) {
      await expect(page.locator('#board-preview .tile-syllable').nth(i)).toHaveText(tiles[i]!);
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
    await page.goto(PRACTICE_TEST_URL);
    const input = page.locator('#guess-input');
    await input.click();
    await input.fill('xptmxm');
    await input.evaluate((el) => el.dispatchEvent(new Event('input', { bubbles: true })));
    await expect(input).toHaveValue(ANSWER_TEST);
    const tiles = groupedPreviewForAnswer(ANSWER_TEST, ANSWER_TEST);
    for (let i = 0; i < tiles.length; i++) {
      await expect(page.locator('#board-preview .tile-syllable').nth(i)).toHaveText(tiles[i]!);
    }
  });

  test('answer jamo groups: 가연 preview is [가][여][ㄴ] mid-type and after submit', async ({
    page,
  }, testInfo) => {
    const expectedMid = groupedPreviewForAnswer(ANSWER_TEST, '가연');
    expect(expectedMid).toEqual(['가', '여', 'ㄴ']);

    await page.goto(PRACTICE_TEST_URL);
    const input = page.locator('#guess-input');
    await input.click();
    await input.fill('가연');
    await input.evaluate((el) => el.dispatchEvent(new Event('input', { bubbles: true })));

    for (let i = 0; i < expectedMid.length; i++) {
      await expect(page.locator('#board-preview .tile-syllable').nth(i)).toHaveText(expectedMid[i]!);
    }

    await page.screenshot({
      path: '/opt/cursor/artifacts/screenshots/preview-grouped-gayeon.png',
      fullPage: false,
    });

    await page.locator('[data-action="backspace"]').click({ clickCount: 8 });
    for (const jamo of ['ㄱ', 'ㅏ', 'ㄴ', 'ㅏ', 'ㄷ', 'ㅏ']) {
      await page.locator(`[data-jamo-key="${jamo}"]`).click();
    }
    const submitted = '가나다';
    await page.locator('[data-action="enter"]').click();
    const afterSubmit = groupedPreviewForAnswer(ANSWER_TEST, submitted);
    for (let i = 0; i < afterSubmit.length; i++) {
      await expect(page.locator('#board-preview .tile-syllable').nth(i)).toHaveText(
        afterSubmit[i]!,
      );
    }
  });

  test('aligned syllables: 바보 on 2-syllable practice shows [바][보]', async ({ page }) => {
    await page.goto('./?mode=practice');
    for (let i = 0; i < 80; i++) {
      const n = await page.locator('#board').getAttribute('data-syllable-count');
      if (n === '2') break;
      await page.locator('#btn-new').click();
    }
    for (const key of ['ㅂ', 'ㅏ', 'ㅂ', 'ㅗ']) {
      await page.locator(`[data-jamo-key="${key}"]`).click();
    }
    await expect(page.locator('#board-preview .tile-syllable').nth(0)).toHaveText('바');
    await expect(page.locator('#board-preview .tile-syllable').nth(1)).toHaveText('보');
  });

  test('backspace mid-syllable on jamo keyboard updates preview', async ({ page }) => {
    await page.goto('./');
    for (const jamo of ['ㄱ', 'ㅏ']) {
      await page.locator(`[data-jamo-key="${jamo}"]`).click();
    }
    await expect(page.locator('#guess-input')).toHaveValue('가');
    await page.locator('[data-action="backspace"]').click();
    await expect(page.locator('#guess-input')).toHaveValue('ㄱ');
    await expect(page.locator('#board-preview .tile-syllable').first()).toHaveText('ㄱ');
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
      const typed = prior + syl;
      const tiles = groupedPreviewForDailyGuess(typed);
      for (let t = 0; t < tiles.length; t++) {
        await expect(page.locator('#board-preview .tile-syllable').nth(t)).toHaveText(tiles[t]!);
      }
      prior = typed;
    }
    await expect(input).toHaveValue(daily.word);
  });

  test('desktop IME mid-composition: second syllable visible before compositionend', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(browserName !== 'chromium', 'CDP + DOM IME journey runs on Chromium desktop');
    await page.goto(PRACTICE_TEST_URL);
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

    const grouped = groupedPreviewForAnswer(ANSWER_TEST, '가연');
    for (let i = 0; i < grouped.length; i++) {
      await expect(page.locator('#board-preview .tile-syllable').nth(i)).toHaveText(grouped[i]!);
    }
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
    for (let i = 0; i < grouped.length; i++) {
      await expect(page.locator('#board-preview .tile-syllable').nth(i)).toHaveText(grouped[i]!);
    }
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
