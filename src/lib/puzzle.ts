import puzzles from '../../data/puzzles.json';
import { wordToJamos } from './jamo';

export type PuzzleEntry = {
  word: string;
  definition: string;
  date?: string;
};

export type Puzzle = PuzzleEntry & {
  id: string;
  jamoCount: number;
};

const ANCHOR = new Date('2025-01-01T12:00:00+09:00');

export function getSeoulDateString(at = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(at);
}

function enrich(entry: PuzzleEntry, id: string): Puzzle {
  return {
    ...entry,
    id,
    jamoCount: wordToJamos(entry.word).length,
  };
}

export function getAllPuzzles(): Puzzle[] {
  return (puzzles as PuzzleEntry[]).map((p, i) =>
    enrich(p, p.date ?? `pool-${i}`),
  );
}

/** Same puzzle for everyone on a given Seoul calendar day. */
export function getDailyPuzzle(dateStr = getSeoulDateString()): Puzzle {
  const list = puzzles as PuzzleEntry[];
  const scheduled = list.find((p) => p.date === dateStr);
  if (scheduled) {
    return enrich(scheduled, `date-${dateStr}`);
  }

  const pool = list.filter((p) => !p.date);
  const dayStart = new Date(`${dateStr}T12:00:00+09:00`);
  const days = Math.floor((dayStart.getTime() - ANCHOR.getTime()) / 86_400_000);
  const index = ((days % pool.length) + pool.length) % pool.length;
  const picked = pool[index]!;
  return enrich(picked, `daily-${dateStr}`);
}

export function getPracticePuzzle(seed: number): Puzzle {
  const pool = (puzzles as PuzzleEntry[]).filter((p) => !p.date);
  const index = ((seed % pool.length) + pool.length) % pool.length;
  const picked = pool[index]!;
  return enrich(picked, `practice-${seed}`);
}
