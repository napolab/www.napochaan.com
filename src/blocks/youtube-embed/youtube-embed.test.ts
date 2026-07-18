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
  it('uses the hyphenated slug "youtube-embed" so the Code fence regex cannot claim it', () => {
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

describe('YouTubeEmbed markdown round-trip (jsx converter)', () => {
  // The Payload transformer wires markdownToLexical / lexicalToMarkdown for
  // nested-node conversion, plus close/open match arrays for regex-driven
  // parsers. This block uses none of that — supply typed stubs so the tests
  // exercise the same call shape Payload uses at runtime.
  const lexicalToMarkdown = () => '';
  const markdownToLexical = () => ({});
  const openMatchOf = (line: string): RegExpMatchArray => {
    const match = line.match(/^```youtube-embed\s*$/);
    if (match === null) throw new Error('open match failed');

    return match;
  };
  const closeMatchOf = (): RegExpMatchArray => {
    const match = '```'.match(/^```\s*$/);
    if (match === null) throw new Error('close match failed');

    return match;
  };
  const openMatch = openMatchOf('```youtube-embed');
  const closeMatch = closeMatchOf();

  it('exports a URL-only field set as a two-line fence (open / URL / close)', () => {
    const markdown = YouTubeEmbed.jsx.export({ fields: { url: URL_HTTPS }, lexicalToMarkdown });
    expect(markdown).toBe(['```youtube-embed', URL_HTTPS, '```'].join('\n'));
  });

  it('exports URL + caption as URL on line 1 and caption on line 2', () => {
    const markdown = YouTubeEmbed.jsx.export({ fields: { url: URL_HTTPS, caption: 'Rick roll' }, lexicalToMarkdown });
    expect(markdown).toBe(['```youtube-embed', URL_HTTPS, 'Rick roll', '```'].join('\n'));
  });

  it('imports a URL-only fence body', () => {
    const result = YouTubeEmbed.jsx.import({ children: URL_HTTPS, closeMatch, openMatch, markdownToLexical, props: {} });
    expect(result).toEqual({ url: URL_HTTPS });
  });

  it('imports a URL + caption fence body', () => {
    const result = YouTubeEmbed.jsx.import({ children: `${URL_HTTPS}\nRick roll`, closeMatch, openMatch, markdownToLexical, props: {} });
    expect(result).toEqual({ url: URL_HTTPS, caption: 'Rick roll' });
  });

  it('trims each line and strips blank lines before parsing', () => {
    const result = YouTubeEmbed.jsx.import({ children: `   ${URL_HTTPS}   \n\n  caption text  \n`, closeMatch, openMatch, markdownToLexical, props: {} });
    expect(result).toEqual({ url: URL_HTTPS, caption: 'caption text' });
  });

  it('accepts the youtu.be short link form on import', () => {
    const short = `https://youtu.be/${ID}`;
    const result = YouTubeEmbed.jsx.import({ children: short, closeMatch, openMatch, markdownToLexical, props: {} });
    expect(result).toEqual({ url: short });
  });

  it('rejects a fence body whose URL line is not a YouTube URL', () => {
    const result = YouTubeEmbed.jsx.import({ children: 'https://vimeo.com/1234', closeMatch, openMatch, markdownToLexical, props: {} });
    expect(result).toBe(false);
  });

  it('rejects an empty fence body', () => {
    const result = YouTubeEmbed.jsx.import({ children: '', closeMatch, openMatch, markdownToLexical, props: {} });
    expect(result).toBe(false);
  });

  it('rejects a fence body with more than two content lines', () => {
    const result = YouTubeEmbed.jsx.import({ children: `${URL_HTTPS}\ncaption\nextra`, closeMatch, openMatch, markdownToLexical, props: {} });
    expect(result).toBe(false);
  });
});
