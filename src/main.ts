import './style.css';
import { initAnalytics, setUserProps, track } from './analytics';
import { exposure, getFlags, initExperiments } from './experiment';
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
import { jamosForKey, renderKeyboardHtml } from './ui/keyboard';

type Mode = 'daily' | 'practice';

type GameState = {
  mode: Mode;
  puzzle: Puzzle;
  attempts: string[];
  statuses: JamoState[][];
  finished: boolean;
  won: boolean;
  hintUsed: boolean;
  practiceSeed: number;
};

const app = document.querySelector<HTMLDivElement>('#app')!;

function createInitialState(mode: Mode, practiceSeed: number): GameState {
  const puzzle =
    mode === 'daily' ? getDailyPuzzle() : getPracticePuzzle(practiceSeed);
  return {
    mode,
    puzzle,
    attempts: [],
    statuses: [],
    finished: false,
    won: false,
    hintUsed: false,
    practiceSeed,
  };
}

let state = createInitialState('daily', Date.now());
let flags = getFlags();
const seoulToday = getSeoulDateString();
let draftJamos: string[] = [];
let imeComposing = false;
let handlersBound = false;

function targetJamoCount(): number {
  return wordToJamos(state.puzzle.word).length;
}

function syncDraftFromHangul(raw: string): void {
  const maxSyllables = syllableCount(state.puzzle.word);
  const hangul = extractHangulSyllables(raw, maxSyllables);
  draftJamos = wordToJamos(hangul);
  const cap = targetJamoCount();
  if (draftJamos.length > cap) {
    draftJamos = draftJamos.slice(0, cap);
  }
}

function draftPreview(): string {
  return jamosToHangul(draftJamos);
}

function focusGuessInput(): void {
  if (state.finished) return;
  const input = document.querySelector<HTMLInputElement>('#guess-input');
  input?.focus();
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
    const rowJamos = isActive ? draftJamos : guess ? wordToJamos(guess) : [];
    const states = statuses[rowIdx];
    return `
      <div class="row" aria-label="${rowIdx + 1}번째 시도">
        ${jamos
          .map((_, colIdx) => {
            const letter = rowJamos[colIdx] ?? '';
            const st = states?.[colIdx] ?? (letter ? 'tbd' : 'empty');
            return `<div class="tile ${st}" data-state="${st}">${letter}</div>`;
          })
          .join('')}
      </div>`;
  }).join('');

  const hintLine =
    state.hintUsed && !won
      ? `<p class="hint">힌트: 첫 자모는 <strong>${jamos[0]}</strong></p>`
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
        <span class="badge">${mode === 'daily' ? '오늘의 퍼즐' : '연습 모드'}</span>
        <span class="streak" title="서울 기준 연속 성공">🔥 ${streak.count}일</span>
      </div>
    </header>

    <section class="toolbar">
      <button type="button" id="mode-daily" class="${mode === 'daily' ? 'active' : ''}">데일리</button>
      <button type="button" id="mode-practice" class="${mode === 'practice' ? 'active' : ''}">연습</button>
      <button type="button" id="btn-share" ${finished ? '' : 'disabled'}>결과 공유</button>
      <button type="button" id="btn-new" style="${mode === 'practice' ? '' : 'display:none'}">새 단어</button>
    </section>

    <p class="info">자모 ${puzzle.jamoCount}칸 · 음절 ${syllableCount(puzzle.word)}글자 · 기회 ${maxAttempts}번</p>

    <section class="board" id="board" role="grid" aria-live="polite" tabindex="0" aria-label="자모 보드 — 탭하면 입력칸으로 이동">
      ${rows}
    </section>

    ${hintLine}
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
      <p class="draft-preview" aria-live="polite">${draftJamos.length ? `입력 중: ${draftPreview() || '…'} (${draftJamos.length}/${puzzle.jamoCount} 자모)` : `자모 ${draftJamos.length}/${puzzle.jamoCount}`}</p>
    </section>

    <p class="message" id="message"></p>

    ${finished ? '' : renderKeyboardHtml(keyStates)}

    <footer class="footer">
      <p>Amplitude · Session Replay · Experiment 데모용 시드 데이터만 사용합니다.</p>
    </footer>
  `;

  bindHandlers();

  const input = document.querySelector<HTMLInputElement>('#guess-input');
  if (input && !finished) {
    input.value = draftPreview();
    input.focus({ preventScroll: true });
    input.addEventListener('compositionstart', () => {
      imeComposing = true;
    });
    input.addEventListener('compositionend', () => {
      imeComposing = false;
      syncDraftFromHangul(input.value);
      input.value = draftPreview() || extractHangulSyllables(input.value, syllableCount(puzzle.word));
      render();
    });
    input.oninput = () => {
      if (imeComposing) return;
      syncDraftFromHangul(input.value);
      const preview = draftPreview();
      if (preview) input.value = preview;
      updateDraftUi();
    };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitCurrent();
      }
    };
  }
}

function updateDraftUi(): void {
  const preview = document.querySelector('.draft-preview');
  if (preview) {
    preview.textContent = draftJamos.length
      ? `입력 중: ${draftPreview() || '…'} (${draftJamos.length}/${targetJamoCount()} 자모)`
      : `자모 ${draftJamos.length}/${targetJamoCount()}`;
  }
  const activeRow = state.attempts.length;
  const row = document.querySelectorAll('.row')[activeRow];
  if (!row || state.finished) return;
  const jamos = wordToJamos(state.puzzle.word);
  jamos.forEach((_, colIdx) => {
    const tile = row.querySelectorAll('.tile')[colIdx] as HTMLElement | undefined;
    if (!tile) return;
    const letter = draftJamos[colIdx] ?? '';
    tile.textContent = letter;
    tile.className = `tile ${letter ? 'tbd' : 'empty'}`;
    tile.dataset.state = letter ? 'tbd' : 'empty';
  });
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
      draftJamos = draftJamos.slice(0, -1);
      const input = document.querySelector<HTMLInputElement>('#guess-input');
      if (input) input.value = draftPreview();
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
  const cap = targetJamoCount();
  for (const j of units) {
    if (draftJamos.length >= cap) break;
    draftJamos.push(j);
  }
  const input = document.querySelector<HTMLInputElement>('#guess-input');
  if (input) input.value = draftPreview();
  updateDraftUi();
  focusGuessInput();
}

function switchMode(mode: Mode): void {
  if (mode === state.mode) return;
  track('mode_switched', { from: state.mode, to: mode });
  exposure('mode_switch');
  draftJamos = [];
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

function submitCurrent(): void {
  if (state.finished) return;
  const msg = document.querySelector('#message');
  const cap = targetJamoCount();

  if (draftJamos.length !== cap) {
    if (msg) {
      msg.textContent =
        draftJamos.length === 0
          ? `자모 ${cap}개를 입력한 뒤 「입력」을 눌러 주세요.`
          : `자모 ${cap}개가 필요해요. (현재 ${draftJamos.length}개)`;
    }
    track('guess_rejected', { reason: 'jamo_count', mode: state.mode });
    return;
  }

  let guess: string;
  try {
    guess = jamosToHangul(draftJamos);
  } catch {
    if (msg) msg.textContent = '올바른 한글 조합이 아니에요. 자모 순서를 확인해 주세요.';
    return;
  }

  if (syllableCount(guess) !== syllableCount(state.puzzle.word)) {
    if (msg) {
      msg.textContent = `음절 ${syllableCount(state.puzzle.word)}글자로 맞춰 주세요.`;
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
  draftJamos = [];

  track('guess_submitted', {
    mode: state.mode,
    attempt: state.attempts.length,
    jamo_count: states.length,
    correct_jamos: states.filter((s) => s === 'correct').length,
  });

  if (msg) msg.textContent = '';

  maybeOfferHint();

  if (isWin(states)) {
    finishGame(true);
  } else if (state.attempts.length >= flags.maxAttempts) {
    finishGame(false);
  }

  render();
}

function maybeOfferHint(): void {
  if (state.hintUsed || state.finished) return;
  if (state.attempts.length >= flags.hintAfterAttempt) {
    state.hintUsed = true;
    track('hint_used', {
      mode: state.mode,
      after_attempt: state.attempts.length,
      flag_hint_after: flags.hintAfterAttempt,
    });
    exposure('hint_after_attempt');
  }
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
  return `${title} ${seoulToday} · ${state.won ? state.attempts.length : 'X'}/${flags.maxAttempts}\n${grid}\n${flags.shareSuffix}`;
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
  draftJamos = [];
  state = createInitialState('practice', Date.now());
  track('game_start', { ...gameStartProps(), mode: 'practice' });
  render();
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
}

boot();
