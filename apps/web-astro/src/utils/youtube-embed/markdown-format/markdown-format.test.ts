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
