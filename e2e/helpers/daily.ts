import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syllableCount, wordToJamos } from '../../src/lib/jamo';
import type { PuzzleEntry } from '../../src/lib/puzzle';

const __dirname = dirname(fileURLToPath(import.meta.url));
const puzzles = JSON.parse(
  readFileSync(join(__dirname, '../../data/puzzles.json'), 'utf8'),
) as PuzzleEntry[];

const ANCHOR = new Date('2025-01-01T12:00:00+09:00');

export function getSeoulDateString(at = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(at);
}

function getDailyWord(dateStr = getSeoulDateString()): string {
  const scheduled = puzzles.find((p) => p.date === dateStr);
  if (scheduled) return scheduled.word;

  const pool = puzzles.filter((p) => !p.date);
  const dayStart = new Date(`${dateStr}T12:00:00+09:00`);
  const days = Math.floor((dayStart.getTime() - ANCHOR.getTime()) / 86_400_000);
  const index = ((days % pool.length) + pool.length) % pool.length;
  return pool[index]!.word;
}

export function todayDaily() {
  const word = getDailyWord();
  const jamos = wordToJamos(word);
  return {
    word,
    jamos,
    jamoCount: jamos.length,
    syllables: syllableCount(word),
  };
}

/** Distinct wrong Hangul words with the same syllable count as today's daily (for lose flow). */
export function wrongGuessesForDaily(count: number): string[] {
  const { syllables, word } = todayDaily();
  const pool = [
    '가나다',
    '라마바',
    '사아자',
    '차카타',
    '파하거',
    '너더러',
    '머버서',
    '어저처',
    '카라마',
    '바사아',
  ].filter((w) => syllableCount(w) === syllables && w !== word);
  return pool.slice(0, count);
}
