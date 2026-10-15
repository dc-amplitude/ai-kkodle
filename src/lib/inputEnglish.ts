import { containsHangul, displayGuessLetters, normalizeLatinWord, wordToLetters } from './latin';

export type EnglishInputResult = {
  latin: string;
  rejectedHangul: boolean;
  inlineMessage?: string;
};

export function processEnglishInputText(raw: string, maxLetters: number): EnglishInputResult {
  if (containsHangul(raw)) {
    return {
      latin: '',
      rejectedHangul: true,
      inlineMessage: '영어 답은 A–Z만 입력해 주세요. 한글이 섞이면 지워집니다.',
    };
  }
  const latin = displayGuessLetters(raw).slice(0, maxLetters);
  return { latin, rejectedHangul: false };
}

export function maxLatinLetters(answerWord: string): number {
  return wordToLetters(answerWord).length;
}

export function isCompleteLatinGuess(raw: string, answerWord: string): boolean {
  return normalizeLatinWord(raw).length === maxLatinLetters(answerWord);
}
