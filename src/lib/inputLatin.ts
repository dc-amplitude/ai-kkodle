import { convertQwertyToHangul } from 'es-hangul';
import { extractHangulSyllables } from './jamo';

const LATIN = /[A-Za-z]/;
const HANGUL_SYLLABLE = /[\uAC00-\uD7A3]/;

export type InputProcessResult = {
  hangul: string;
  inlineMessage?: string;
  convertedFromQwerty?: boolean;
  rejectedNonHangul?: boolean;
};

/** Process text field value when not in IME composition. */
export function processInputText(raw: string, maxSyllables: number): InputProcessResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { hangul: '' };
  }

  const hasLatin = LATIN.test(trimmed);
  const hasHangul = HANGUL_SYLLABLE.test(trimmed);

  if (!hasLatin) {
    const hangul = extractHangulSyllables(trimmed, maxSyllables);
    if (!hangul && trimmed.length > 0) {
      return {
        hangul: '',
        rejectedNonHangul: true,
        inlineMessage: '한글로 입력해 주세요 (한/영 키를 눌러 전환)',
      };
    }
    return { hangul };
  }

  if (hasHangul) {
    return {
      hangul: extractHangulSyllables(trimmed, maxSyllables),
      inlineMessage: '한글만 사용할 수 있어요. 영문은 제외했습니다.',
    };
  }

  const qwertyCandidate = trimmed.replace(/\s/g, '');
  const converted = convertQwertyToHangul(qwertyCandidate);
  const hangul = extractHangulSyllables(converted, maxSyllables);
  if (hangul) {
    return {
      hangul,
      convertedFromQwerty: true,
      inlineMessage: '영문 자판 입력을 한글로 변환했어요.',
    };
  }

  return {
    hangul: '',
    rejectedNonHangul: true,
    inlineMessage: '한글로 입력해 주세요 (한/영 키를 눌러 전환)',
  };
}
