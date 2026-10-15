import './style.css';
import { initAnalytics, setUserProps, track } from './analytics';
import { exposure, getFlags, initExperiments } from './experiment';
import {
  evaluateGuess,
  isWin,
  normalizeGuess,
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

function render(): void {
  const { puzzle, attempts, statuses, finished, won, mode } = state;
  const maxAttempts = flags.maxAttempts;
  const jamos = wordToJamos(puzzle.word);
  const streak = loadStreak();

  const rows = Array.from({ length: maxAttempts }, (_, rowIdx) => {
    const guess = attempts[rowIdx] ?? '';
    const rowJamos = guess ? wordToJamos(guess) : [];
    const states = statuses[rowIdx];
    return `
      <div class="row" aria-label="${rowIdx + 1}번째 시도">
        ${jamos
          .map((_, colIdx) => {
            const letter = rowJamos[colIdx] ?? '';
            const st = states?.[colIdx] ?? 'empty';
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

    <section class="board" role="grid" aria-live="polite">
      ${rows}
    </section>

    ${hintLine}
    ${resultLine}

    <p class="message" id="message"></p>

    <input id="hidden-input" class="visually-hidden" autocomplete="off" autocapitalize="off" inputmode="text" lang="ko" />

    <footer class="footer">
      <p>Amplitude · Session Replay · Experiment 데모용 시드 데이터만 사용합니다.</p>
    </footer>
  `;

  document.querySelector('#mode-daily')?.addEventListener('click', () => switchMode('daily'));
  document.querySelector('#mode-practice')?.addEventListener('click', () => switchMode('practice'));
  document.querySelector('#btn-share')?.addEventListener('click', shareResult);
  document.querySelector('#btn-new')?.addEventListener('click', newPracticeRound);

  const input = document.querySelector<HTMLInputElement>('#hidden-input')!;
  input.value = attempts[attempts.length] ?? '';
  if (!finished) {
    input.focus();
    input.oninput = () => handleInput(input.value);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') submitCurrent(input.value);
      if (e.key === 'Backspace' && !input.value) {
        e.preventDefault();
      }
    };
  }
}

function switchMode(mode: Mode): void {
  if (mode === state.mode) return;
  track('mode_switched', { from: state.mode, to: mode });
  exposure('mode_switch');
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

function handleInput(raw: string): void {
  const msg = document.querySelector('#message');
  const cleaned = normalizeGuess(raw);
  const maxSyllables = syllableCount(state.puzzle.word);
  const syllables = [...cleaned].slice(0, maxSyllables);
  const next = syllables.join('');
  const input = document.querySelector<HTMLInputElement>('#hidden-input');
  if (input && input.value !== next) input.value = next;
  if (msg) msg.textContent = '';
}

function submitCurrent(raw: string): void {
  if (state.finished) return;
  const guess = normalizeGuess(raw);
  const msg = document.querySelector('#message');
  if (!guess) return;

  if (syllableCount(guess) !== syllableCount(state.puzzle.word)) {
    if (msg) msg.textContent = `음절 ${syllableCount(state.puzzle.word)}글자로 맞춰 주세요.`;
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

  track('guess_submitted', {
    mode: state.mode,
    attempt: state.attempts.length,
    jamo_count: states.length,
    correct_jamos: states.filter((s) => s === 'correct').length,
  });

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
