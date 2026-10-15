import './style.css';
import { initAnalytics, setUserProps, track } from './analytics';
import { exposure, getFlags, initExperiments } from './experiment';
import { appendKeyboardJamos, hangulToKeyboardJamos, setInputAtEnd } from './lib/draft';
import {
  HINT_TIER_COUNT,
  hintMessage,
  hintsRemaining,
  type HintTier,
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
import {
  getDailyPuzzle,
  getPracticePuzzle,
  getSeoulDateString,
  type Puzzle,
} from './lib/puzzle';
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
import { jamosForKey, renderKeyboardHtml } from './ui/keyboard';

type Mode = 'daily' | 'practice';

type GameState = {
  mode: Mode;
  puzzle: Puzzle;
  attempts: string[];
  statuses: JamoState[][];
  finished: boolean;
  won: boolean;
  hintsRevealed: number;
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
    hintsRevealed: 0,
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
let handlersBound = false;
let inputHandlersBound = false;

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

function commitInputToDraft(input: HTMLInputElement): void {
  draftHangul = extractHangulSyllables(input.value, maxSyllablesForPuzzle());
  keyboardJamos = hangulToKeyboardJamos(draftHangul);
  setInputAtEnd(input, draftHangul);
}

/** Live keyboard path: keep es-hangul assemble output (may include in-progress jamo). */
function syncDraftFromKeyboard(): void {
  const cap = targetJamoCount();
  const jamos = keyboardJamos.slice(0, cap);
  draftHangul = jamos.length ? jamosToHangul(jamos) : '';
}

function focusGuessInput(): void {
  if (state.finished) return;
  document.querySelector<HTMLInputElement>('#guess-input')?.focus();
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
  const remaining = hintsRemaining(state.hintsRevealed);
  const hintButtonLabel =
    remaining > 0 ? `힌트 (${remaining}개 남음)` : '힌트 모두 사용함';
  const hintLockNote =
    !hintsUnlocked && !finished
      ? `<p class="hint-lock">${flags.hintAfterAttempt}번째 시도부터 힌트를 쓸 수 있어요.</p>`
      : '';
  const revealedHints =
    state.hintsRevealed > 0
      ? `<ul class="hint-list">${Array.from({ length: state.hintsRevealed }, (_, i) => {
          const tier = (i + 1) as HintTier;
          return `<li><span class="hint-tier">힌트 ${tier}</span> ${hintMessage(tier, puzzle)}</li>`;
        }).join('')}</ul>`
      : '';

  const resultLine =
    finished && won
      ? `<p class="definition">${puzzle.definition}</p>`
      : finished
        ? `<p class="fail">정답: <strong>${puzzle.word}</strong> — ${puzzle.definition}</p>`
        : '';

  app.innerHTML = `
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

    <p class="play-hint">${syllableCount(puzzle.word)}글자 단어를 입력하세요 (사전 제한 없음)</p>

    <section class="board" id="board" data-jamo-count="${jamos.length}" style="--jamo-count: ${jamos.length}" role="grid" aria-live="polite" tabindex="0" aria-label="자모 보드 — 탭하면 입력칸으로 이동">
      ${rows}
    </section>

    ${resultLine}

    <section class="input-area">
      <label for="guess-input" class="input-label">한글 ${syllableCount(puzzle.word)}음절 · 자모 ${puzzle.jamoCount}칸 맞추기</label>
      <p class="input-hint">아래 <strong>자모 키보드</strong>를 누르거나, 이 칸에 한글 키보드(IME)로 입력하세요.</p>
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
    </section>

    <p class="message" id="message"></p>

    ${finished ? '' : renderKeyboardHtml(keyStates)}
  `;

  bindHandlers();
  bindInputHandlers();

  const input = document.querySelector<HTMLInputElement>('#guess-input');
  if (input && !finished) {
    if (!imeComposing) {
      setInputAtEnd(input, draftHangul);
    }
    if (!isHowToPlayVisible()) {
      input.focus({ preventScroll: true });
    }
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
    if (target.closest('#board')) {
      focusGuessInput();
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

function appendJamoKeys(units: string[]): void {
  if (state.finished) return;
  keyboardJamos = appendKeyboardJamos(keyboardJamos, units, targetJamoCount());
  syncDraftFromKeyboard();
  const input = document.querySelector<HTMLInputElement>('#guess-input');
  if (input) setInputAtEnd(input, draftHangul);
  updateDraftUi();
  focusGuessInput();
}

function resetDraft(): void {
  draftHangul = '';
  keyboardJamos = [];
  imeComposing = false;
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
  if (state.hintsRevealed >= HINT_TIER_COUNT) return;

  const tier = (state.hintsRevealed + 1) as HintTier;
  state.hintsRevealed = tier;

  track('hint_used', {
    mode: state.mode,
    hint_level: tier,
    hints_revealed: state.hintsRevealed,
    after_attempt: state.attempts.length,
    flag_hint_after: flags.hintAfterAttempt,
  });
  if (state.mode === 'daily' && tier === 1 && state.attempts.length >= flags.hintAfterAttempt) {
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
  const hintMark = state.hintsRevealed > 0 ? ` · 💡${state.hintsRevealed}` : '';
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
