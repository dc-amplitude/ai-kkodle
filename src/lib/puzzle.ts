import puzzles from '../../data/puzzles.json';
import type { DifficultyTier } from '../experiment';
import { syllableCount } from './jamo';
import { wordToLetters } from './latin';
import { unitCount as playUnitCount } from './playMode';

export type PuzzleOrigin = 'loanword' | 'korean';

export type PuzzleCategory = 'ai' | 'it-foundation';

export type PuzzleScript = 'ko' | 'en';

export type PuzzleEntry = {
  word: string;
  script: PuzzleScript;
  definition: string;
  usage: string;
  example: string;
  startingHint: string;
  etymology: string;
  category: PuzzleCategory;
  date?: string;
  origin: PuzzleOrigin;
  englishSource?: string;
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
  const script = entry.script ?? 'ko';
  const full = { ...entry, script };
  return {
    ...full,
    id,
    jamoCount: playUnitCount(full),
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

function practicePool(tier: DifficultyTier): PuzzleEntry[] {
  const pool = (puzzles as PuzzleEntry[]).filter((p) => !p.date);
  if (tier === 'hard') return pool;
  const short = pool.filter((p) => {
    const script = p.script ?? 'ko';
    if (script === 'en') {
      const n = wordToLetters(p.word).length;
      return n >= 2 && n <= 6;
    }
    const n = syllableCount(p.word);
    return n >= 2 && n <= 3;
  });
  return short.length > 0 ? short : pool;
}

export function getPracticePuzzle(seed: number, tier: DifficultyTier = 'normal'): Puzzle {
  const pool = practicePool(tier);
  const index = ((seed % pool.length) + pool.length) % pool.length;
  const picked = pool[index]!;
  return enrich(picked, `practice-${seed}`);
}
