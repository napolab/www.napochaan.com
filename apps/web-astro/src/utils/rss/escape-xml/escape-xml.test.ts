import { describe, expect, it } from 'vitest';

import { escapeXml } from '.';

describe('escapeXml', () => {
  it('replaces & first so later entities are not double-escaped', () => {
    expect(escapeXml('rock & <roll>')).toBe('rock &amp; &lt;roll&gt;');
  });

  it('escapes double and single quotes', () => {
    expect(escapeXml(`"a" 'b'`)).toBe('&quot;a&quot; &apos;b&apos;');
  });

  it('leaves plain text untouched', () => {
    expect(escapeXml('hello world')).toBe('hello world');
  });
});
