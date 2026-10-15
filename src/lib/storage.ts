const STREAK_KEY = 'ai-jamo-streak';
const LAST_PLAYED_KEY = 'ai-jamo-last-played';

export type StreakState = {
  count: number;
  lastSeoulDate: string | null;
};

export function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 0, lastSeoulDate: null };
    return JSON.parse(raw) as StreakState;
  } catch {
    return { count: 0, lastSeoulDate: null };
  }
}

export function saveStreak(state: StreakState): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(state));
}

export function updateStreakOnWin(todaySeoul: string): StreakState {
  const prev = loadStreak();
  let count = 1;
  if (prev.lastSeoulDate) {
    const yesterday = shiftSeoulDate(todaySeoul, -1);
    if (prev.lastSeoulDate === todaySeoul) {
      count = prev.count;
    } else if (prev.lastSeoulDate === yesterday) {
      count = prev.count + 1;
    }
  }
  const next = { count, lastSeoulDate: todaySeoul };
  saveStreak(next);
  return next;
}

function shiftSeoulDate(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T12:00:00+09:00`);
  d.setDate(d.getDate() + deltaDays);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
}

export function markDailyPlayed(dateStr: string): void {
  localStorage.setItem(LAST_PLAYED_KEY, dateStr);
}

export function wasDailyPlayed(dateStr: string): boolean {
  return localStorage.getItem(LAST_PLAYED_KEY) === dateStr;
}
