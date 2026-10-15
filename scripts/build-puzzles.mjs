#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertValidContent } from './content-rules.mjs';
import { ENGLISH_CATALOG } from './english-catalog.mjs';
import { PUZZLE_CATALOG as KOREAN_CATALOG } from './puzzle-catalog.mjs';
import { PUZZLE_SOURCES } from './puzzle-sources.mjs';

const PUZZLE_CATALOG = [
  ...KOREAN_CATALOG.map((e) => ({ script: 'ko', ...e })),
  ...ENGLISH_CATALOG.map((e) => ({ script: 'en', ...e })),
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../data/puzzles.json');

const words = new Set();
const enriched = [];

for (const seed of PUZZLE_CATALOG) {
  if (words.has(seed.word)) throw new Error(`Duplicate word: ${seed.word}`);
  words.add(seed.word);

  const sources = PUZZLE_SOURCES[seed.word];
  if (!sources?.length) {
    throw new Error(`Missing sources map entry for "${seed.word}"`);
  }

  const entry = { ...seed, sources: [...sources] };
  assertValidContent(entry);
  enriched.push(entry);
}

const dated = enriched.filter((p) => p.date);
if (dated.length !== 1 || dated[0].date !== '2026-10-15') {
  throw new Error('Expected exactly one scheduled puzzle on 2026-10-15');
}

writeFileSync(outPath, `${JSON.stringify(enriched, null, 2)}\n`);
console.log(`Wrote ${enriched.length} puzzles to ${outPath}`);
