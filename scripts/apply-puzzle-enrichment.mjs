#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import ENRICHMENT, { GAME_BANNED } from './puzzle-enrichment-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const puzzlesPath = join(__dirname, '../data/puzzles.json');

const WORD_REPLACEMENTS = {
  주니어: { word: '스크럼', origin: 'loanword', englishSource: 'scrum' },
  협업: { word: '킥오프', origin: 'loanword', englishSource: 'kickoff' },
};

const TEXT_FIELDS = ['definition', 'usage', 'example', 'startingHint'];

function applyReplacement(entry) {
  const repl = WORD_REPLACEMENTS[entry.word];
  if (!repl) return entry;
  return {
    ...entry,
    word: repl.word,
    origin: repl.origin,
    englishSource: repl.englishSource,
  };
}

function mergeEnrichment(entry) {
  const data = ENRICHMENT[entry.word];
  if (!data) {
    throw new Error(`Missing enrichment for word: ${entry.word}`);
  }
  const { origin: _o, englishSource: _e, ...fields } = data;
  return {
    ...entry,
    ...fields,
  };
}

function containsBanned(text) {
  return GAME_BANNED.some((phrase) => text.includes(phrase));
}

function validatePuzzle(entry) {
  for (const field of TEXT_FIELDS) {
    const value = entry[field];
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`Missing or empty ${field} for "${entry.word}"`);
    }
    if (containsBanned(value)) {
      throw new Error(`Banned game phrase in ${field} for "${entry.word}"`);
    }
  }
  if (entry.startingHint.includes(entry.word)) {
    throw new Error(`startingHint contains answer substring for "${entry.word}"`);
  }
}

const raw = JSON.parse(readFileSync(puzzlesPath, 'utf8'));
const enrichmentKeys = Object.keys(ENRICHMENT);

if (enrichmentKeys.length !== 119) {
  throw new Error(`Expected 119 enrichment keys, got ${enrichmentKeys.length}`);
}

const updated = raw.map((entry) => {
  const replaced = applyReplacement(entry);
  return mergeEnrichment(replaced);
});

const wordSet = new Set(updated.map((p) => p.word));
for (const key of enrichmentKeys) {
  if (!wordSet.has(key)) {
    throw new Error(`Enrichment key has no puzzle entry after apply: ${key}`);
  }
}

for (const entry of updated) {
  if (!ENRICHMENT[entry.word]) {
    throw new Error(`Puzzle "${entry.word}" has no enrichment key`);
  }
  validatePuzzle(entry);
}

writeFileSync(puzzlesPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log(`Applied enrichment to ${updated.length} puzzles.`);
