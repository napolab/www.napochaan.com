import { unescapeLinkCaption } from '@utils/lexical/link-embed';
import { describe, expect, it } from 'vitest';

import { formatYouTubeEmbedMarkdown } from '.';

const ID = 'dQw4w9WgXcQ';
const URL_HTTPS = `https://www.youtube.com/watch?v=${ID}`;

describe('formatYouTubeEmbedMarkdown', () => {
  it('emits a bare URL line when the caption is empty', () => {
    expect(formatYouTubeEmbedMarkdown(URL_HTTPS, '')).toBe(URL_HTTPS);
  });

  it('emits a [caption](url) line when a caption is present', () => {
    expect(formatYouTubeEmbedMarkdown(URL_HTTPS, 'Rick roll')).toBe(`[Rick roll](${URL_HTTPS})`);
  });

  it('escapes [ and ] in the caption as \\[ and \\] (CommonMark-valid output)', () => {
    expect(formatYouTubeEmbedMarkdown(URL_HTTPS, 'a [b] c')).toBe(`[a \\[b\\] c](${URL_HTTPS})`);
  });

  it('leaves parentheses in the caption unescaped', () => {
    expect(formatYouTubeEmbedMarkdown(URL_HTTPS, 'live (2024)')).toBe(`[live (2024)](${URL_HTTPS})`);
  });
});

// escape(この module)⇔ unescape(汎用層 @utils/lexical/link-embed)は別 module に
// 分かれた 1:1 の対。片側だけの変更でこのペアが壊れないよう、両方を import して
// 逆変換になっていることをここで固定する(cross-module-sync-test)。
describe('escapeCaption ⇔ unescapeLinkCaption round-trip', () => {
  it('unescapeLinkCaption reverses the escape applied by formatYouTubeEmbedMarkdown', () => {
    expect(unescapeLinkCaption('a \\[b\\] c')).toBe('a [b] c');
  });

  it('round-trips a caption through format + unescape (link-text portion)', () => {
    const formatted = formatYouTubeEmbedMarkdown(URL_HTTPS, 'a [b] c');
    const linkText = formatted.slice(1, formatted.indexOf('](', 1));
    expect(unescapeLinkCaption(linkText)).toBe('a [b] c');
  });

  it('leaves captions without escapes unchanged', () => {
    expect(unescapeLinkCaption('plain caption')).toBe('plain caption');
  });
});
