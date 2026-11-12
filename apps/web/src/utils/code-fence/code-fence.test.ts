import { describe, expect, it } from 'vitest';

import { fenceForCode } from '.';

describe('fenceForCode', () => {
  it('returns the minimum 3-backtick fence for plain code', () => {
    expect(fenceForCode('const x = 1;')).toBe('```');
  });

  it('returns a 4-backtick fence when the code contains a 3-backtick line', () => {
    expect(fenceForCode('例:\n```bash\nnpm run build\n```')).toBe('````');
  });

  it('grows past the longest leading backtick run', () => {
    expect(fenceForCode('````\ninner\n````')).toBe('`````');
  });

  it('ignores backticks that are not at the start of a line', () => {
    expect(fenceForCode('const s = `a```b`;')).toBe('```');
  });

  it('counts indented fence lines too', () => {
    expect(fenceForCode('  ```\n  code\n  ```')).toBe('````');
  });
});
