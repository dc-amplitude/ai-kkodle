import { describe, expect, it } from 'vitest';
import { syllableCount, wordToJamos } from '../lib/jamo';
import {
  previewTileFromJamoGroup,
  previewTilesFromAnswerJamos,
  renderBoardRowHtml,
  renderSyllablePreviewHtml,
} from './board';

describe('previewTilesFromAnswerJamos', () => {
  it('maps 가연 jamos into answer [2][2][2] groups as [가][여][ㄴ]', () => {
    const answer = '테스트';
    const jamos = wordToJamos('가연');
    expect(previewTilesFromAnswerJamos(answer, jamos)).toEqual(['가', '여', 'ㄴ']);
  });

  it('matches typed syllables when groups align (바보)', () => {
    expect(previewTilesFromAnswerJamos('바보', wordToJamos('바보'))).toEqual(['바', '보']);
    expect(previewTilesFromAnswerJamos('바보', wordToJamos('바'))).toEqual(['바', '']);
  });

  it('previewTileFromJamoGroup shows raw jamo for incomplete groups', () => {
    expect(previewTileFromJamoGroup(['ㄴ'])).toBe('ㄴ');
    expect(previewTileFromJamoGroup(['ㄱ', 'ㅏ'])).toBe('가');
  });
});

describe('renderSyllablePreviewHtml', () => {
  it('renders one preview tile per answer syllable group', () => {
    const html = renderSyllablePreviewHtml('바보', ['바', '보'], undefined, 'live');
    const slots = html.match(/syllable-preview-slot/g)?.length ?? 0;
    expect(slots).toBe(2);
    expect(html).toContain('>바<');
    expect(html).toContain('>보<');
  });
});

describe('renderBoardRowHtml', () => {
  it('renders jamo groups without big syllable tiles per row', () => {
    for (const word of ['환각', '바보']) {
      const html = renderBoardRowHtml(word, [], undefined, 'empty');
      expect(html).not.toContain('tile-syllable');
      expect(html.match(/class="syl-group/g)?.length).toBe(syllableCount(word));
    }
  });
});
