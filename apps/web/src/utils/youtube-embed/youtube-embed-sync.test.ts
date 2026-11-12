import { describe, expect, it } from 'vitest';

import { formatYouTubeEmbedMarkdown as formatCMS } from '../../../../cms/src/blocks/youtube-embed/markdown-format';
import { parseYouTubeVideoID as parseCMS } from '../../../../cms/src/blocks/youtube-embed/parse-url';
import { formatYouTubeEmbedMarkdown as formatWeb } from './markdown-format';
import { parseYouTubeVideoID as parseWeb } from './parse-url';

// cms validates youtube-embed URLs on write and owns the Markdown syntax (MCP jsx.export);
// web renders the iframe and emits the same Markdown for llms.txt / .md. The two copies
// must agree, so this imports both workspaces' modules (cross-module-sync-test).
const ID = 'dQw4w9WgXcQ';

const URL_CASES = [
  `https://www.youtube.com/watch?v=${ID}`,
  `https://www.youtube.com/watch?v=${ID}&t=42s`,
  `https://youtu.be/${ID}`,
  `https://www.youtube.com/embed/${ID}`,
  `https://www.youtube.com/shorts/${ID}`,
  `https://m.youtube.com/watch?v=${ID}`,
  `https://www.youtube-nocookie.com/embed/${ID}`,
  `  https://youtu.be/${ID}  `,
  `http://www.youtube.com/watch?v=${ID}`,
  `https://vimeo.com/${ID}`,
  'https://www.youtube.com/watch',
  'https://www.youtube.com/watch?v=short',
  'https://www.youtube.com/watch?v=dQw4w9WgX!Q',
  ID,
  '',
  'not a url',
];

const CAPTION_CASES = ['', 'Rick roll', 'a [b] c', 'live (2024)'];

describe('youtube-embed web ⇔ cms copies', () => {
  it.each(URL_CASES)('parse-url agrees on %j', (url) => {
    expect(parseWeb(url)).toEqual(parseCMS(url));
  });

  it.each(CAPTION_CASES)('markdown-format agrees on caption %j', (caption) => {
    const url = `https://www.youtube.com/watch?v=${ID}`;

    expect(formatWeb(url, caption)).toBe(formatCMS(url, caption));
  });
});
