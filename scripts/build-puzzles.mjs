#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GAME_BANNED_PHRASES, PUZZLE_CATALOG } from './puzzle-catalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../data/puzzles.json');

const TEXT_FIELDS = ['definition', 'usage', 'example', 'startingHint', 'etymology'];

function containsBanned(text) {
  return GAME_BANNED_PHRASES.some((p) => text.includes(p));
}

function validate(entry) {
  for (const field of TEXT_FIELDS) {
    const v = entry[field];
    if (typeof v !== 'string' || !v.trim()) {
      throw new Error(`Missing ${field} for "${entry.word}"`);
    }
    if (containsBanned(v)) {
      throw new Error(`Banned phrase in ${field} for "${entry.word}"`);
    }
  }
  if (entry.startingHint.includes(entry.word)) {
    throw new Error(`startingHint contains answer for "${entry.word}"`);
  }
  if (!['ai', 'it-foundation'].includes(entry.category)) {
    throw new Error(`Invalid category for "${entry.word}"`);
  }
  if (entry.origin === 'loanword' && !entry.englishSource?.trim()) {
    throw new Error(`Missing englishSource for loanword "${entry.word}"`);
  }
}

const words = new Set();
for (const seed of PUZZLE_CATALOG) {
  if (words.has(seed.word)) throw new Error(`Duplicate word: ${seed.word}`);
  words.add(seed.word);
  validate(seed);
}

const dated = PUZZLE_CATALOG.filter((p) => p.date);
if (dated.length !== 1 || dated[0].date !== '2026-10-15') {
  throw new Error('Expected exactly one scheduled puzzle on 2026-10-15');
}

writeFileSync(outPath, `${JSON.stringify(PUZZLE_CATALOG, null, 2)}\n`);
console.log(`Wrote ${PUZZLE_CATALOG.length} puzzles to ${outPath}`);
