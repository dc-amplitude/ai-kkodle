import { describe, expect, it } from 'vitest';
import { syllableCount, wordToJamos } from '../lib/jamo';
import { renderBoardRowHtml } from './board';

describe('renderBoardRowHtml', () => {
  it('renders one syllable unit per answer syllable', () => {
    for (const word of ['환각', '프롬프트', '데일']) {
      const html = renderBoardRowHtml(word, [], undefined, 'empty');
      const units = html.match(/class="syllable-unit/g)?.length ?? 0;
      expect(units, word).toBe(syllableCount(word));
    }
  });

  it('shows composed syllable on big tile when jamos filled', () => {
    const all = wordToJamos('환각');
    const pref = wordToJamos('환');
    const row = all.map((_, i) => pref[i] ?? '');
    const html = renderBoardRowHtml('환각', row, undefined, 'tbd');
    expect(html).toContain('tile-syllable');
    expect(html).toContain('>환<');
  });
});
