import './style.css';
import { initAnalytics, setUserProps, track } from './analytics';
import { exposure, getFlags, initExperiments } from './experiment';
import { appendKeyboardJamos, hangulToKeyboardJamos, setInputAtEnd } from './lib/draft';
import {
  hintMessage,
  hintsRemaining,
  paidHintTier,
} from './lib/hints';
import {
  aggregateKeyStates,
  evaluateGuess,
  extractHangulSyllables,
  isWin,
  jamosToHangul,
  statesToEmoji,
  syllableCount,
  wordToJamos,
  type JamoState,
} from './lib/jamo';
import { processInputText } from './lib/inputLatin';
import {
  getDailyPuzzle,
  getPracticePuzzle,
  getSeoulDateString,
  type Puzzle,
} from './lib/puzzle';
import {
  answerExplanationHtml,
  categoryBadgeLabel,
  originBadgeLabel,
  successDefinitionHtml,
} from './lib/puzzleOrigin';
import {
  loadStreak,
  markDailyPlayed,
  updateStreakOnWin,
  wasDailyPlayed,
} from './lib/storage';
import { renderBoardRowHtml } from './ui/board';
import {
  hasSeenHowToPlay,
  isHowToPlayVisible,
  openHowToPlay,
} from './ui/howToPlay';
import {
  applyDeviceClasses,
  isTouchPrimary,
  setMobileImeEnabled,
  shouldAutoFocusGuessInput,
  shouldUseOnScreenKeyboardPrimary,
} from './lib/deviceInput';
import { initMobileViewport } from './mobileViewport';
import { jamosForKey, renderKeyboardHtml } from './ui/keyboard';

type Mode = 'daily' | 'practice';

type GameState = {
  mode: Mode;
  puzzle: Puzzle;
  attempts: string[];
  statuses: JamoState[][];
  finished: boolean;
  won: boolean;
  paidHintsRevealed: number;
  practiceSeed: number;
};

const app = document.querySelector<HTMLDivElement>('#app')!;

function createInitialState(mode: Mode, practiceSeed: number): GameState {
  const puzzle =
    mode === 'daily'
      ? getDailyPuzzle()
      : getPracticePuzzle(practiceSeed, getFlags().difficultyTier);
  return {
    mode,
    puzzle,
    attempts: [],
    statuses: [],
    finished: false,
    won: false,
    paidHintsRevealed: 0,
    practiceSeed,
  };
}

let state = createInitialState('daily', Date.now());
let flags = getFlags();
const seoulToday = getSeoulDateString();
/** Source of truth for committed Hangul (IME + keyboard). */
let draftHangul = '';
/** Parallel jamo buffer for on-screen keyboard live assembly. */
let keyboardJamos: string[] = [];
let imeComposing = false;
let inputInlineMessage = '';
let handlersBound = false;
let inputHandlersBound = false;
let mobileGuardsBound = false;

function maxSyllablesForPuzzle(): number {
  return syllableCount(state.puzzle.word);
}

function targetJamoCount(): number {
  return wordToJamos(state.puzzle.word).length;
}

function draftJamosForBoard(): string[] {
  const cap = targetJamoCount();
  if (keyboardJamos.length) return keyboardJamos.slice(0, cap);
  return wordToJamos(extractHangulSyllables(draftHangul, maxSyllablesForPuzzle()));
}

function setInputInlineMessage(text: string): void {
  inputInlineMessage = text;
  const el = document.querySelector('#input-message');
  if (el) el.textContent = text;
}

function commitInputToDraft(input: HTMLInputElement): void {
  const result = processInputText(input.value, maxSyllablesForPuzzle());

  if (result.rejectedNonHangul) {
    track('guess_rejected', { reason: 'non_hangul', mode: state.mode });
    setInputInlineMessage(result.inlineMessage ?? '');
    draftHangul = '';
    keyboardJamos = [];
    updateBoardPreviewFromInput('');
    return;
  }

  draftHangul = result.hangul;
  keyboardJamos = hangulToKeyboardJamos(draftHangul);
  setInputInlineMessage(result.inlineMessage ?? '');

  if (result.convertedFromQwerty || draftHangul !== input.value) {
    setInputAtEnd(input, draftHangul);
  }
}

/** Live keyboard path: keep es-hangul assemble output (may include in-progress jamo). */
function syncDraftFromKeyboard(): void {
  const cap = targetJamoCount();
  const jamos = keyboardJamos.slice(0, cap);
  draftHangul = jamos.length ? jamosToHangul(jamos) : '';
}

function focusGuessInput(): void {
  if (state.finished || !shouldAutoFocusGuessInput()) return;
  document.querySelector<HTMLInputElement>('#guess-input')?.focus({ preventScroll: true });
}

function configureGuessInput(input: HTMLInputElement, finished: boolean): void {
  const touchPrimary = shouldUseOnScreenKeyboardPrimary();
  if (finished) {
    input.removeAttribute('readonly');
    input.inputMode = 'text';
    return;
  }
  if (touchPrimary) {
    input.readOnly = true;
    input.inputMode = 'none';
    input.setAttribute('aria-readonly', 'true');
  } else {
    input.readOnly = false;
    input.inputMode = 'text';
    input.removeAttribute('aria-readonly');
  }
}

function updateBoardPreviewFromInput(raw: string): void {
  const previewHangul = extractHangulSyllables(raw, maxSyllablesForPuzzle());
  const previewJamos = wordToJamos(previewHangul);
  const activeRow = state.attempts.length;
  const row = document.querySelectorAll('.row')[activeRow];
  if (!row || state.finished) return;
  const jamos = wordToJamos(state.puzzle.word);
  jamos.forEach((_, colIdx) => {
    const tile = row.querySelectorAll('.tile')[colIdx] as HTMLElement | undefined;
    if (!tile) return;
    const letter = previewJamos[colIdx] ?? '';
    tile.textContent = letter;
    tile.className = `tile ${letter ? 'tbd' : 'empty'}`;
    tile.dataset.state = letter ? 'tbd' : 'empty';
  });
}

function render(): void {
  const { puzzle, attempts, statuses, finished, won, mode } = state;
  const maxAttempts = flags.maxAttempts;
  const jamos = wordToJamos(puzzle.word);
  const streak = loadStreak();
  const keyStates = aggregateKeyStates(attempts, statuses);
  const activeRow = attempts.length;

  const rows = Array.from({ length: maxAttempts }, (_, rowIdx) => {
    const isActive = rowIdx === activeRow && !finished;
    const guess = attempts[rowIdx] ?? '';
    const rowJamos = isActive ? draftJamosForBoard() : guess ? wordToJamos(guess) : [];
    const rowStates = statuses[rowIdx];
    return `
      <div class="row" aria-label="${rowIdx + 1}번째 시도">
        ${renderBoardRowHtml(puzzle.word, rowJamos, rowStates, isActive ? 'tbd' : 'empty')}
      </div>`;
  }).join('');

  const hintsUnlocked =
    mode === 'practice' || attempts.length >= flags.hintAfterAttempt || finished;
  const remaining = hintsRemaining(state.paidHintsRevealed);
  const hintButtonLabel =
    remaining > 0 ? `힌트 (${remaining}개 남음)` : '힌트 모두 사용함';
  const hintLockNote =
    !hintsUnlocked && !finished
      ? `<p class="hint-lock">${flags.hintAfterAttempt}번째 시도부터 추가 힌트를 쓸 수 있어요. (뜻 힌트는 처음부터 제공)</p>`
      : '';
  const paidHintItems = Array.from({ length: state.paidHintsRevealed }, (_, i) => {
    const tier = paidHintTier(i + 1);
    return `<li><span class="hint-tier">힌트 ${tier}</span> ${hintMessage(tier, puzzle)}</li>`;
  }).join('');
  const revealedHints = finished
    ? paidHintItems
      ? `<ul class="hint-list">${paidHintItems}</ul>`
      : ''
    : `<ul class="hint-list">
        <li class="hint-free"><span class="hint-tier">시작 힌트</span> ${hintMessage(1, puzzle)}</li>
        ${paidHintItems}
      </ul>`;

  const originBadge = `<p class="origin-badge">${categoryBadgeLabel(puzzle)} · ${originBadgeLabel(puzzle)}</p>`;

  const resultLine =
    finished && won
      ? successDefinitionHtml(puzzle)
      : finished
        ? `<p class="fail">정답: <strong>${puzzle.word}</strong></p>${answerExplanationHtml(puzzle)}`
        : '';

  const touchPrimary = isTouchPrimary();
  const onScreenKbPrimary = shouldUseOnScreenKeyboardPrimary();
  const inputHintHtml = onScreenKbPrimary
    ? '<p class="input-hint input-hint-touch">아래 <strong>자모 키보드</strong>로 입력하세요. 휴대폰 키보드는 아래 버튼으로 켤 수 있어요.</p>'
    : '<p class="input-hint">아래 <strong>자모 키보드</strong>를 누르거나, 이 칸에 한글 키보드(IME)로 입력하세요.</p>';
  const mobileImeToggle = touchPrimary && !finished
    ? `<button type="button" id="btn-mobile-ime" class="mobile-ime-toggle">${onScreenKbPrimary ? '휴대폰 키보드로 입력' : '자모 키보드로 입력'}</button>`
    : '';

  app.innerHTML = `
    <div class="game-shell">
    <header class="header">
      <div>
        <h1>${flags.shareTitle}</h1>
        <p class="subtitle">${flags.shareSuffix} · 난이도 ${flags.difficultyLabel}</p>
      </div>
      <div class="meta">
        <button type="button" id="btn-howto" class="icon-btn" title="게임 방법" aria-label="게임 방법">?</button>
        <span class="badge">${mode === 'daily' ? '오늘의 퍼즐' : '연습 모드'}</span>
        <span class="streak" title="서울 기준 연속 성공">🔥 ${streak.count}일</span>
      </div>
    </header>

    <section class="toolbar">
      <button type="button" id="mode-daily" class="${mode === 'daily' ? 'active' : ''}">데일리</button>
      <button type="button" id="mode-practice" class="${mode === 'practice' ? 'active' : ''}">연습</button>
      <button type="button" id="btn-share" ${finished ? '' : 'disabled'}>결과 공유</button>
      <button type="button" id="btn-new" style="${mode === 'practice' ? '' : 'display:none'}">새 단어</button>
      <button
        type="button"
        id="btn-hint"
        class="hint-btn"
        ${!finished && hintsUnlocked && remaining > 0 ? '' : 'disabled'}
        title="${hintsUnlocked ? hintButtonLabel : `${flags.hintAfterAttempt}번 시도 후 힌트 잠금 해제`}"
      >💡 ${hintButtonLabel}</button>
    </section>
    ${hintLockNote}
    ${revealedHints}

    <p class="info">자모 ${puzzle.jamoCount}칸 · 음절 ${syllableCount(puzzle.word)}글자 · 기회 ${maxAttempts}번 · 음절 테두리 초록 = 해당 글자 전체 정답</p>

    ${finished ? '' : originBadge}

    <p class="play-hint">${syllableCount(puzzle.word)}글자 단어를 입력하세요 (아무 단어나 입력 가능)</p>

    <section class="board" id="board" data-jamo-count="${jamos.length}" style="--jamo-count: ${jamos.length}" role="grid" aria-live="polite" tabindex="0" aria-label="자모 보드 — 탭하면 입력칸으로 이동">
      ${rows}
    </section>

    ${resultLine}

    <section class="input-area">
      <label for="guess-input" class="input-label">한글 ${syllableCount(puzzle.word)}음절 · 자모 ${puzzle.jamoCount}칸 맞추기</label>
      ${inputHintHtml}
      ${mobileImeToggle}
      <input
        id="guess-input"
        class="guess-input"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        inputmode="text"
        lang="ko"
        enterkeyhint="done"
        placeholder="한글 단어 입력"
        ${finished ? 'disabled' : ''}
      />
      <p class="draft-preview" aria-live="polite">${draftPreviewLabel()}</p>
      <p class="input-message" id="input-message" aria-live="polite">${inputInlineMessage}</p>
    </section>

    <p class="message" id="message"></p>

    ${finished ? '' : renderKeyboardHtml(keyStates)}
    </div>
  `;

  bindHandlers();
  bindInputHandlers();
  bindMobileInputGuards();

  const input = document.querySelector<HTMLInputElement>('#guess-input');
  if (input && !finished) {
    configureGuessInput(input, false);
    if (!imeComposing) {
      setInputAtEnd(input, draftHangul);
    }
    if (!isHowToPlayVisible() && shouldAutoFocusGuessInput()) {
      input.focus({ preventScroll: true });
    }
  }

  const board = document.querySelector('#board');
  if (board) {
    board.setAttribute(
      'aria-label',
      onScreenKbPrimary
        ? '자모 보드'
        : '자모 보드 — 탭하면 입력칸으로 이동',
    );
  }
}

function draftPreviewLabel(): string {
  const jamos = draftJamosForBoard();
  const cap = targetJamoCount();
  return jamos.length
    ? `입력 중: ${draftHangul || '…'} (${jamos.length}/${cap} 자모)`
    : `자모 ${jamos.length}/${cap}`;
}

function updateDraftUi(): void {
  const preview = document.querySelector('.draft-preview');
  if (preview) preview.textContent = draftPreviewLabel();
  updateBoardPreviewFromInput(draftHangul);
}

function bindMobileInputGuards(): void {
  if (mobileGuardsBound) return;
  mobileGuardsBound = true;

  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target as HTMLElement;
      if (!target.matches('#guess-input')) return;
      if (shouldUseOnScreenKeyboardPrimary()) {
        target.blur();
      }
    },
    true,
  );
}

function bindInputHandlers(): void {
  if (inputHandlersBound) return;
  inputHandlersBound = true;

  app.addEventListener(
    'compositionstart',
    (e) => {
      const input = e.target as HTMLElement;
      if (!input.matches('#guess-input')) return;
      imeComposing = true;
    },
    true,
  );

  app.addEventListener(
    'compositionupdate',
    (e) => {
      const input = e.target as HTMLInputElement;
      if (!input.matches('#guess-input') || !imeComposing) return;
      updateBoardPreviewFromInput(input.value);
    },
    true,
  );

  app.addEventListener(
    'compositionend',
    (e) => {
      const input = e.target as HTMLInputElement;
      if (!input.matches('#guess-input')) return;
      imeComposing = false;
      commitInputToDraft(input);
      updateDraftUi();
    },
    true,
  );

  app.addEventListener(
    'input',
    (e) => {
      const input = e.target as HTMLInputElement;
      if (!input.matches('#guess-input')) return;
      if (imeComposing) {
        updateBoardPreviewFromInput(input.value);
        return;
      }
      commitInputToDraft(input);
      updateDraftUi();
    },
    true,
  );

  app.addEventListener(
    'keydown',
    (e) => {
      const input = e.target as HTMLInputElement;
      if (!input.matches('#guess-input')) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        submitCurrent();
      }
    },
    true,
  );
}

function bindHandlers(): void {
  if (handlersBound) return;
  handlersBound = true;

  app.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (target.closest('#mode-daily')) {
      switchMode('daily');
      return;
    }
    if (target.closest('#mode-practice')) {
      switchMode('practice');
      return;
    }
    if (target.closest('#btn-share')) {
      void shareResult();
      return;
    }
    if (target.closest('#btn-new')) {
      newPracticeRound();
      return;
    }
    if (target.closest('#btn-howto')) {
      openHowToPlay(flags.maxAttempts, 'help_button', trackHowToPlayOpened);
      return;
    }
    if (target.closest('#btn-hint')) {
      useNextHint();
      return;
    }
    if (target.closest('#btn-mobile-ime')) {
      toggleMobileIme();
      return;
    }
    if (target.closest('#board')) {
      if (!shouldUseOnScreenKeyboardPrimary()) {
        focusGuessInput();
      }
      return;
    }

    const jamoKey = target.closest<HTMLButtonElement>('[data-jamo-key]');
    if (jamoKey) {
      appendJamoKeys(jamosForKey(jamoKey.dataset.jamoKey!));
      return;
    }

    const actionBtn = target.closest<HTMLButtonElement>('[data-action]');
    if (actionBtn?.dataset.action === 'backspace') {
      if (keyboardJamos.length > 0) {
        keyboardJamos = keyboardJamos.slice(0, -1);
      } else {
        const syllables = [...draftHangul];
        syllables.pop();
        draftHangul = syllables.join('');
        keyboardJamos = hangulToKeyboardJamos(draftHangul);
      }
      syncDraftFromKeyboard();
      const input = document.querySelector<HTMLInputElement>('#guess-input');
      if (input) setInputAtEnd(input, draftHangul);
      updateDraftUi();
      return;
    }
    if (actionBtn?.dataset.action === 'enter') {
      submitCurrent();
    }
  });
}

function toggleMobileIme(): void {
  const enabling = shouldUseOnScreenKeyboardPrimary();
  setMobileImeEnabled(enabling);
  render();
  const input = document.querySelector<HTMLInputElement>('#guess-input');
  if (!input || state.finished) return;
  configureGuessInput(input, false);
  if (enabling) {
    input.focus({ preventScroll: true });
  } else {
    input.blur();
  }
}

function appendJamoKeys(units: string[]): void {
  if (state.finished) return;
  keyboardJamos = appendKeyboardJamos(keyboardJamos, units, targetJamoCount());
  syncDraftFromKeyboard();
  const input = document.querySelector<HTMLInputElement>('#guess-input');
  if (input) setInputAtEnd(input, draftHangul);
  updateDraftUi();
  if (!shouldUseOnScreenKeyboardPrimary()) {
    focusGuessInput();
  }
}

function resetDraft(): void {
  draftHangul = '';
  keyboardJamos = [];
  imeComposing = false;
  inputInlineMessage = '';
}

function switchMode(mode: Mode): void {
  if (mode === state.mode) return;
  track('mode_switched', { from: state.mode, to: mode });
  exposure('mode_switch');
  resetDraft();
  state = createInitialState(mode, Date.now());
  if (mode === 'daily') {
    track('game_start', gameStartProps());
  } else {
    track('game_start', { ...gameStartProps(), mode: 'practice' });
  }
  render();
}

function gameStartProps(): Record<string, string | number | boolean> {
  return {
    mode: state.mode,
    puzzle_id: state.puzzle.id,
    jamo_count: state.puzzle.jamoCount,
    seoul_date: seoulToday,
    max_attempts: flags.maxAttempts,
    starting_hint: true,
  };
}

function readGuessFromDraft(): string {
  const input = document.querySelector<HTMLInputElement>('#guess-input');
  if (input && !imeComposing) {
    commitInputToDraft(input);
  }
  return draftHangul;
}

function submitCurrent(): void {
  if (state.finished || imeComposing) return;
  const msg = document.querySelector('#message');
  const guess = readGuessFromDraft();

  if (!guess) {
    if (msg) msg.textContent = '한글 단어를 입력해 주세요.';
    return;
  }

  const guessJamos = wordToJamos(guess);
  const cap = targetJamoCount();
  if (guessJamos.length !== cap) {
    if (msg) {
      msg.textContent = `글자 수는 ${maxSyllablesForPuzzle()}음절이어야 해요. (현재 ${syllableCount(guess)}음절 · 자모 ${guessJamos.length}/${cap})`;
    }
    track('guess_rejected', { reason: 'jamo_count', mode: state.mode });
    return;
  }

  if (syllableCount(guess) !== maxSyllablesForPuzzle()) {
    if (msg) {
      msg.textContent = `음절 ${maxSyllablesForPuzzle()}글자로 맞춰 주세요.`;
    }
    track('guess_rejected', { reason: 'syllable_count', mode: state.mode });
    return;
  }

  let states: JamoState[];
  try {
    states = evaluateGuess(state.puzzle.word, guess);
  } catch {
    if (msg) msg.textContent = '자모 길이가 맞지 않아요. 한글 단어만 입력해 주세요.';
    return;
  }

  state.attempts.push(guess);
  state.statuses.push(states);
  resetDraft();

  track('guess_submitted', {
    mode: state.mode,
    attempt: state.attempts.length,
    jamo_count: states.length,
    correct_jamos: states.filter((s) => s === 'correct').length,
  });

  if (msg) msg.textContent = '';

  if (isWin(states)) {
    finishGame(true);
  } else if (state.attempts.length >= flags.maxAttempts) {
    finishGame(false);
  }

  render();
}

function hintsUnlockedNow(): boolean {
  return (
    state.mode === 'practice' ||
    state.attempts.length >= flags.hintAfterAttempt ||
    state.finished
  );
}

function useNextHint(): void {
  if (state.finished) return;
  if (!hintsUnlockedNow()) {
    const msg = document.querySelector('#message');
    if (msg) {
      msg.textContent = `데일리 모드에서는 ${flags.hintAfterAttempt}번 시도 후 힌트를 쓸 수 있어요.`;
    }
    return;
  }
  if (state.paidHintsRevealed >= 2) return;

  state.paidHintsRevealed += 1;
  const tier = paidHintTier(state.paidHintsRevealed);

  track('hint_used', {
    mode: state.mode,
    hint_level: tier,
    paid_hints_revealed: state.paidHintsRevealed,
    after_attempt: state.attempts.length,
    flag_hint_after: flags.hintAfterAttempt,
  });
  if (
    state.mode === 'daily' &&
    state.paidHintsRevealed === 1 &&
    state.attempts.length >= flags.hintAfterAttempt
  ) {
    exposure('hint_after_attempt');
  }

  const msg = document.querySelector('#message');
  if (msg) msg.textContent = '';
  render();
}

function finishGame(won: boolean): void {
  state.finished = true;
  state.won = won;
  track('game_complete', {
    mode: state.mode,
    success: won,
    attempts: state.attempts.length,
    puzzle_id: state.puzzle.id,
  });

  if (won && state.mode === 'daily') {
    const streak = updateStreakOnWin(seoulToday);
    markDailyPlayed(seoulToday);
    track('streak_day', {
      streak_count: streak.count,
      seoul_date: seoulToday,
      already_played: wasDailyPlayed(seoulToday),
    });
  }
}

function buildShareText(): string {
  const grid = state.statuses.map((s) => statesToEmoji(s)).join('\n');
  const title = flags.shareTitle;
  const hintMark = state.paidHintsRevealed > 0 ? ` · 💡${state.paidHintsRevealed}` : '';
  return `${title} ${seoulToday} · ${state.won ? state.attempts.length : 'X'}/${flags.maxAttempts}${hintMark}\n${grid}\n${flags.shareSuffix}`;
}

async function shareResult(): Promise<void> {
  const text = buildShareText();
  track('share_clicked', {
    mode: state.mode,
    success: state.won,
    attempts: state.attempts.length,
  });
  exposure('share_copy');

  if (navigator.share) {
    try {
      await navigator.share({ title: flags.shareTitle, text });
      return;
    } catch {
      /* fall through */
    }
  }
  await navigator.clipboard.writeText(text);
  const msg = document.querySelector('#message');
  if (msg) msg.textContent = '결과를 클립보드에 복사했어요.';
}

function newPracticeRound(): void {
  resetDraft();
  state = createInitialState('practice', Date.now());
  track('game_start', { ...gameStartProps(), mode: 'practice' });
  render();
}

function trackHowToPlayOpened(source: 'auto' | 'help_button'): void {
  track('how_to_play_opened', { source, mode: state.mode });
}

async function boot(): Promise<void> {
  applyDeviceClasses();
  initMobileViewport();
  window.matchMedia('(pointer: coarse)').addEventListener('change', () => {
    applyDeviceClasses();
  });

  await initAnalytics();
  flags = await initExperiments();
  setUserProps({
    difficulty: flags.difficultyLabel,
    max_attempts: flags.maxAttempts,
  });
  track('game_start', gameStartProps());
  render();
  if (!hasSeenHowToPlay()) {
    openHowToPlay(flags.maxAttempts, 'auto', trackHowToPlayOpened);
  }
}

boot();
