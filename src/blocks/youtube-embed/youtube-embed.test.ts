import { describe, expect, it } from 'vitest';

import { YouTubeEmbed } from '.';

const ID = 'dQw4w9WgXcQ';
const URL_HTTPS = `https://www.youtube.com/watch?v=${ID}`;

// The Payload text-field `validate` receives (value, options) at runtime, but
// the options object shape varies by field kind. Our validate only reads the
// value, so a minimal stub is enough — cast via a helper to keep tests terse.
const runUrlValidate = (value: unknown): string | true | Promise<string | true> => {
  const url = YouTubeEmbed.fields.find((field) => 'name' in field && field.name === 'url');
  if (url?.type !== 'text' || url.validate === undefined) throw new Error('url field missing validate');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal validate stub
  return url.validate(value as never, {} as any);
};

describe('YouTubeEmbed block definition', () => {
  it('uses the hyphenated slug "youtube-embed"', () => {
    expect(YouTubeEmbed.slug).toBe('youtube-embed');
  });

  it('has a required url field', () => {
    const url = YouTubeEmbed.fields.find((field) => 'name' in field && field.name === 'url');
    expect(url?.type).toBe('text');
    expect(url && 'required' in url ? url.required : false).toBe(true);
  });

  it('has an optional caption field', () => {
    const caption = YouTubeEmbed.fields.find((field) => 'name' in field && field.name === 'caption');
    expect(caption?.type).toBe('text');
    expect(caption && 'required' in caption ? caption.required : false).not.toBe(true);
  });

  it('url validate accepts a canonical watch URL', () => {
    expect(runUrlValidate(URL_HTTPS)).toBe(true);
  });

  it('url validate rejects a non-YouTube URL with a message', () => {
    expect(typeof runUrlValidate('https://vimeo.com/1234')).toBe('string');
  });

  it('url validate rejects an empty string with a required-field message', () => {
    expect(typeof runUrlValidate('')).toBe('string');
  });
});

describe('YouTubeEmbed markdown export (jsx converter)', () => {
  // The Payload transformer wires lexicalToMarkdown for nested-node conversion;
  // this block's export does not use it — a typed stub matches the call shape.
  const lexicalToMarkdown = () => '';

  it('exports a URL-only field set as a bare URL line', () => {
    const markdown = YouTubeEmbed.jsx.export({ fields: { url: URL_HTTPS }, lexicalToMarkdown });
    expect(markdown).toBe(URL_HTTPS);
  });

  it('exports URL + caption as a [caption](url) line', () => {
    const markdown = YouTubeEmbed.jsx.export({ fields: { url: URL_HTTPS, caption: 'Rick roll' }, lexicalToMarkdown });
    expect(markdown).toBe(`[Rick roll](${URL_HTTPS})`);
  });

  it('escapes [ and ] in the exported caption', () => {
    const markdown = YouTubeEmbed.jsx.export({ fields: { url: URL_HTTPS, caption: 'a [b] c' }, lexicalToMarkdown });
    expect(markdown).toBe(`[a \\[b\\] c](${URL_HTTPS})`);
  });
});

// この block は Markdown import に参加しない(公開構文はリンク行で、取り込みは
// 汎用 link-embed transform + ./embed-provider が担う)。BlockJSX 型が import を必須にしている
// ための意図的な dead スタブであることをピン留めする。
describe('YouTubeEmbed jsx import stub is intentionally dead', () => {
  it('customStartRegex matches no line at all', () => {
    for (const line of ['```youtube-embed', URL_HTTPS, `[cap](${URL_HTTPS})`, '', '<youtube-embed>']) {
      expect(YouTubeEmbed.jsx.customStartRegex?.test(line)).toBe(false);
    }
  });

  it('import always returns false', () => {
    const markdownToLexical = () => ({});
    expect(YouTubeEmbed.jsx.import({ children: URL_HTTPS, closeMatch: null, markdownToLexical, props: {} })).toBe(false);
  });
});
