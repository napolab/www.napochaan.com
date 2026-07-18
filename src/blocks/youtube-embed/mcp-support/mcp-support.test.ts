import { describe, expect, it } from 'vitest';

import { youtubeEmbedMcpSupport } from '.';

const ID = 'dQw4w9WgXcQ';
const URL_HTTPS = `https://www.youtube.com/watch?v=${ID}`;
const FENCE_URL_ONLY = ['```youtube-embed', URL_HTTPS, '```'].join('\n');
const FENCE_WITH_CAPTION = ['```youtube-embed', URL_HTTPS, 'キャプション', '```'].join('\n');

describe('youtubeEmbedMcpSupport.blockType', () => {
  it('is "youtube-embed"', () => {
    expect(youtubeEmbedMcpSupport.blockType).toBe('youtube-embed');
  });
});

describe('youtubeEmbedMcpSupport.validateFences', () => {
  it('accepts a fence with only a valid URL', () => {
    expect(youtubeEmbedMcpSupport.validateFences(FENCE_URL_ONLY)).toEqual([]);
  });

  it('accepts a fence with URL + caption', () => {
    expect(youtubeEmbedMcpSupport.validateFences(FENCE_WITH_CAPTION)).toEqual([]);
  });

  it('accepts the youtu.be short link inside the fence', () => {
    const md = ['```youtube-embed', `https://youtu.be/${ID}`, '```'].join('\n');
    expect(youtubeEmbedMcpSupport.validateFences(md)).toEqual([]);
  });

  it('rejects an empty fence body with a hint', () => {
    const md = ['```youtube-embed', '```'].join('\n');
    const errors = youtubeEmbedMcpSupport.validateFences(md);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('URL');
  });

  it('rejects a fence whose URL line is not a YouTube URL', () => {
    const md = ['```youtube-embed', 'https://vimeo.com/1234', '```'].join('\n');
    const errors = youtubeEmbedMcpSupport.validateFences(md);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('watch?v=');
  });

  it('rejects a fence with more than two content lines', () => {
    const md = ['```youtube-embed', URL_HTTPS, 'caption', 'extra', '```'].join('\n');
    const errors = youtubeEmbedMcpSupport.validateFences(md);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('最大 2 行');
  });

  it('does not touch a plain code fence', () => {
    const md = ['```typescript', 'const x = 1;', '```'].join('\n');
    expect(youtubeEmbedMcpSupport.validateFences(md)).toEqual([]);
  });

  it('does not touch an image-row fence', () => {
    const md = ['```image-row', '![media:1](x)', '![media:2](y)', '```'].join('\n');
    expect(youtubeEmbedMcpSupport.validateFences(md)).toEqual([]);
  });

  it('validates each fence when multiple youtube-embed fences appear', () => {
    const md = `${FENCE_URL_ONLY}\n\n${['```youtube-embed', 'https://vimeo.com/x', '```'].join('\n')}`;
    const errors = youtubeEmbedMcpSupport.validateFences(md);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('watch?v=');
  });

  it('accepts a doc with no fences', () => {
    expect(youtubeEmbedMcpSupport.validateFences('# hi\n\npara')).toEqual([]);
  });
});

describe('youtubeEmbedMcpSupport.extractMediaIDs', () => {
  it('never reports media ids (embed only references YouTube URLs)', () => {
    expect(youtubeEmbedMcpSupport.extractMediaIDs(FENCE_URL_ONLY)).toEqual([]);
  });
});

describe('youtubeEmbedMcpSupport.syntaxHelp', () => {
  it('documents the fence syntax with a concrete example', () => {
    expect(youtubeEmbedMcpSupport.syntaxHelp).toContain('```youtube-embed');
    expect(youtubeEmbedMcpSupport.syntaxHelp).toContain('watch?v=');
  });
});
