import { describe, expect, it } from 'vitest';

import { aliveText, cursorsText, genText, motionText, watchingText } from './status-text';

describe('SysBar status texts', () => {
  it('pads the generation to four digits', () => {
    expect(genText(0)).toBe('gen 0000');
    expect(genText(42)).toBe('gen 0042');
    expect(genText(12345)).toBe('gen 12345');
  });

  it('labels the live counters', () => {
    expect(aliveText(139)).toBe('alive 139');
    expect(watchingText(3)).toBe('watching 3');
  });

  it('names the toggle states', () => {
    expect(cursorsText(true)).toBe('cursors: on');
    expect(cursorsText(false)).toBe('cursors: off');
    expect(motionText(false)).toBe('motion: on');
    expect(motionText(true)).toBe('motion: off');
  });
});
