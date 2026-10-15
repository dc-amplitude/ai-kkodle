#!/usr/bin/env node
/**
 * Apply reviewed CSV (word,script,category,meaning,usage,example,etymology,sources)
 * to puzzle-catalog.mjs, english-catalog.mjs, and puzzle-sources.mjs.
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ENGLISH_CATALOG } from './english-catalog.mjs';
import { PUZZLE_CATALOG as EXISTING_KO } from './puzzle-catalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath =
  process.argv[2] ??
  '/home/ubuntu/.cursor/projects/workspace/uploads/terms-reviewed-merged_3c82.csv';

/** @type {Record<string, { startingHint: string, origin: string, englishSource?: string, date?: string }>} */
const meta = {};
for (const e of EXISTING_KO) {
  meta[e.word] = {
    startingHint: e.startingHint,
    origin: e.origin,
    englishSource: e.englishSource,
    date: e.date,
  };
}
for (const e of ENGLISH_CATALOG) {
  meta[e.word] = {
    startingHint: e.startingHint,
    origin: e.origin,
    englishSource: e.englishSource,
    date: e.date,
  };
}

meta['토크나이저'] = {
  startingHint: '문장을 모델이 세는 작은 단위로 나누는 도구',
  origin: 'loanword',
  englishSource: 'tokenizer',
};
delete meta['파운데이션'];

/** @type {Array<Record<string, string>>} */
const rows = JSON.parse(
  execSync(`python3 "${join(__dirname, 'csv-to-json.py')}" "${csvPath}"`, { encoding: 'utf8' }),
);

if (rows.length !== 119) {
  throw new Error(`Expected 119 rows, got ${rows.length}`);
}

/** @param {string} s */
function jsString(s) {
  return JSON.stringify(s);
}

/** @param {Record<string, string>} row */
function sourcesFromRow(row) {
  return row.sources
    .split('|')
    .map((u) => u.trim())
    .filter(Boolean);
}

/** @type {object[]} */
const koEntries = [];
/** @type {object[]} */
const enEntries = [];
/** @type {Record<string, string[]>} */
const sourcesMap = {};

for (const row of rows) {
  const word = row.word.trim();
  const script = row.script.trim();
  const m = meta[word];
  if (!m) {
    throw new Error(`No metadata (startingHint/origin) for "${word}" — add to meta map`);
  }

  const sources = sourcesFromRow(row);
  if (sources.length < 1) throw new Error(`No sources for ${word}`);
  sourcesMap[word] = sources;

  const base = {
    word,
    category: row.category.trim(),
    origin: m.origin,
    definition: row.meaning.trim(),
    usage: row.usage.trim(),
    example: row.example.trim(),
    startingHint: m.startingHint,
    etymology: row.etymology.trim(),
  };
  if (m.englishSource) base.englishSource = m.englishSource;
  if (m.date) base.date = m.date;

  if (script === 'ko') koEntries.push(base);
  else if (script === 'en') enEntries.push({ script: 'en', ...base });
  else throw new Error(`Invalid script for ${word}`);
}

if (koEntries.length !== 101) throw new Error(`Expected 101 ko entries, got ${koEntries.length}`);
if (enEntries.length !== 18) throw new Error(`Expected 18 en entries, got ${enEntries.length}`);

/** @param {object} e */
function formatEntry(e, indent) {
  const lines = [`${indent}{`];
  const order = [
    'word',
    'script',
    'category',
    'origin',
    'englishSource',
    'date',
    'definition',
    'usage',
    'example',
    'startingHint',
    'etymology',
  ];
  for (const key of order) {
    if (e[key] != null && e[key] !== '') {
      lines.push(`${indent}  ${key}: ${jsString(e[key])},`);
    }
  }
  lines.push(`${indent}},`);
  return lines.join('\n');
}

const koBody = koEntries.map((e) => formatEntry(e, '  ')).join('\n');
const enBody = enEntries.map((e) => formatEntry(e, '  ')).join('\n');

const koFile = `/**
 * Canonical AI / IT puzzle list. Run \`node scripts/build-puzzles.mjs\` to write data/puzzles.json.
 *
 * @typedef {'ai' | 'it-foundation'} PuzzleCategory
 * @typedef {{ word: string, category: PuzzleCategory, origin: 'loanword'|'korean', englishSource?: string, definition: string, usage: string, example: string, startingHint: string, etymology: string, date?: string }} PuzzleSeed
 */

/** @type {PuzzleSeed[]} */
export const PUZZLE_CATALOG = [
${koBody}
];

export { GAME_BANNED_PHRASES } from './content-rules.mjs';
`;

const enFile = `/** @type {import('./puzzle-catalog.mjs').PuzzleSeed[]} */
export const ENGLISH_CATALOG = [
${enBody}
];
`;

const sourceLines = Object.entries(sourcesMap).map(([word, urls]) => {
    const urlList = urls.map((u) => jsString(u)).join(', ');
    return `  ${jsString(word)}: [${urlList}],`;
  })
  .join('\n');

const sourcesFile = `/**
 * Verified reference URLs per answer word (from reviewed CSV).
 * @type {Record<string, string[]>}
 */
export const PUZZLE_SOURCES = {
${sourceLines}
};
`;

writeFileSync(join(__dirname, 'puzzle-catalog.mjs'), koFile);
writeFileSync(join(__dirname, 'english-catalog.mjs'), enFile);
writeFileSync(join(__dirname, 'puzzle-sources.mjs'), sourcesFile);
console.log(`Applied ${rows.length} rows from ${csvPath}`);
