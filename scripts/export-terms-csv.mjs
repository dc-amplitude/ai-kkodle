#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import puzzles from '../data/puzzles.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = '/cursor/stores/self/handoff';
const outPath = join(outDir, 'terms-review.csv');

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const header = [
  'word',
  'script',
  'category',
  'meaning',
  'usage',
  'example',
  'etymology',
  'sources',
];

const rows = puzzles.map((p) =>
  [
    p.word,
    p.script ?? 'ko',
    p.category,
    p.definition,
    p.usage,
    p.example,
    p.etymology,
    (p.sources ?? []).join(' | '),
  ]
    .map(csvEscape)
    .join(','),
);

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${header.join(',')}\n${rows.join('\n')}\n`, 'utf8');
console.log(`Wrote ${puzzles.length} rows to ${outPath}`);
