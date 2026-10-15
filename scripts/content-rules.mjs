/** Shared puzzle content validation (build + vitest). */

export const GAME_BANNED_PHRASES = [
  '이 게임',
  '퍼즐',
  '챌린지 모드',
  '꼬들',
  'wordle',
  'Wordle',
];

const REQUIRED = [
  'word',
  'script',
  'definition',
  'usage',
  'example',
  'startingHint',
  'etymology',
  'category',
  'origin',
  'sources',
];

/** Known typo / garbage patterns in Korean copy. */
const KO_TYPO_PATTERNS = [
  /\s{2,}/,
  /촉\s+cue/i,
  /→\s*→/,
  /\?\?\?/,
];

/**
 * @param {string} text
 * @returns {number} ratio of Hangul syllables among letters (0–1)
 */
function hangulLetterRatio(text) {
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (!letters.length) return 0;
  const hangul = letters.match(/\p{Script=Hangul}/gu)?.length ?? 0;
  return hangul / letters.length;
}

/**
 * @param {Record<string, unknown>} entry
 * @returns {string[]} error messages
 */
export function contentValidationErrors(entry) {
  const errors = [];
  const word = String(entry.word ?? '');

  for (const key of REQUIRED) {
    const v = entry[key];
    if (v == null || (typeof v === 'string' && !v.trim())) {
      errors.push(`${word}: missing ${key}`);
    }
  }

  if (!Array.isArray(entry.sources) || entry.sources.length < 1 || entry.sources.length > 3) {
    errors.push(`${word}: sources must be an array of 1–3 URLs`);
  } else {
    for (const url of entry.sources) {
      if (typeof url !== 'string' || !/^https:\/\/.+/i.test(url)) {
        errors.push(`${word}: invalid source URL "${url}"`);
      }
    }
  }

  const script = entry.script ?? 'ko';
  const textFields = ['definition', 'usage', 'example', 'startingHint', 'etymology'];

  for (const field of textFields) {
    const text = String(entry[field] ?? '');
    for (const banned of GAME_BANNED_PHRASES) {
      if (text.includes(banned)) errors.push(`${word}.${field} contains banned phrase "${banned}"`);
    }
    if (script === 'ko') {
      for (const pat of KO_TYPO_PATTERNS) {
        if (pat.test(text)) errors.push(`${word}.${field} matches typo pattern ${pat}`);
      }
    }
  }

  const example = String(entry.example ?? '');
  if (!example.startsWith('예:')) {
    errors.push(`${word}: example must start with "예:"`);
  }

  const hint = String(entry.startingHint ?? '');
  const answer = word;
  if (hint.includes(answer) || hint.toUpperCase().includes(answer.toUpperCase())) {
    errors.push(`${word}: startingHint contains answer`);
  }

  if (script === 'ko') {
    const body = example.replace(/^예:\s*/, '');
    if (!/\p{Script=Hangul}/u.test(body)) {
      errors.push(`${word}: ko example must contain Hangul (natural Korean sentence)`);
    }
    if (hangulLetterRatio(body) < 0.35 && body.length > 20) {
      errors.push(`${word}: ko example appears mostly non-Korean`);
    }
  }

  if (entry.origin === 'loanword' && !String(entry.englishSource ?? '').trim()) {
    errors.push(`${word}: loanword missing englishSource`);
  }

  if (!['ai', 'it-foundation'].includes(entry.category)) {
    errors.push(`${word}: invalid category`);
  }

  if (!['ko', 'en'].includes(script)) {
    errors.push(`${word}: invalid script`);
  }

  if (script === 'en' && !/^[A-Za-z]+$/.test(word)) {
    errors.push(`${word}: en word must be A–Z only`);
  }

  return errors;
}

/**
 * @param {Record<string, unknown>} entry
 */
export function assertValidContent(entry) {
  const errors = contentValidationErrors(entry);
  if (errors.length) {
    throw new Error(errors.join('\n'));
  }
}
