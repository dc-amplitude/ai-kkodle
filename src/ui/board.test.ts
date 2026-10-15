import { describe, expect, it } from 'vitest';
import { syllableCount } from '../lib/jamo';
import { hangulSyllableSlots, renderBoardRowHtml, renderSyllablePreviewHtml } from './board';

describe('hangulSyllableSlots', () => {
  it('splits 바보 into two syllable slots', () => {
    expect(hangulSyllableSlots('바보', 2)).toEqual(['바', '보']);
    expect(hangulSyllableSlots('바', 2)).toEqual(['바', '']);
  });
});

describe('renderSyllablePreviewHtml', () => {
  it('renders one preview tile per syllable', () => {
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
