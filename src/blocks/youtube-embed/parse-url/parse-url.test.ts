import { describe, expect, it } from 'vitest';

import { parseYouTubeVideoID } from '.';

// A canonical 11-char sample id: 'dQw4w9WgXcQ'.
const ID = 'dQw4w9WgXcQ';

describe('parseYouTubeVideoID', () => {
  it('accepts the canonical watch URL', () => {
    expect(parseYouTubeVideoID(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it('accepts extra query params on a watch URL', () => {
    expect(parseYouTubeVideoID(`https://www.youtube.com/watch?v=${ID}&t=42s`)).toBe(ID);
  });

  it('accepts the youtu.be short link', () => {
    expect(parseYouTubeVideoID(`https://youtu.be/${ID}`)).toBe(ID);
  });

  it('accepts the /embed/ URL', () => {
    expect(parseYouTubeVideoID(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
  });

  it('accepts the /shorts/ URL', () => {
    expect(parseYouTubeVideoID(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
  });

  it('accepts the mobile watch URL', () => {
    expect(parseYouTubeVideoID(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it('accepts the youtube-nocookie embed URL', () => {
    expect(parseYouTubeVideoID(`https://www.youtube-nocookie.com/embed/${ID}`)).toBe(ID);
  });

  it('trims surrounding whitespace before parsing', () => {
    expect(parseYouTubeVideoID(`  https://youtu.be/${ID}  `)).toBe(ID);
  });

  it('rejects http (non-https) URLs', () => {
    expect(parseYouTubeVideoID(`http://www.youtube.com/watch?v=${ID}`)).toBeUndefined();
  });

  it('rejects non-YouTube hosts', () => {
    expect(parseYouTubeVideoID(`https://vimeo.com/watch?v=${ID}`)).toBeUndefined();
  });

  it('rejects a watch URL without a v param', () => {
    expect(parseYouTubeVideoID('https://www.youtube.com/watch')).toBeUndefined();
  });

  it('rejects a watch URL whose v is not 11 chars', () => {
    expect(parseYouTubeVideoID('https://www.youtube.com/watch?v=short')).toBeUndefined();
  });

  it('rejects a v with disallowed characters', () => {
    expect(parseYouTubeVideoID('https://www.youtube.com/watch?v=abcdefghij!')).toBeUndefined();
  });

  it('rejects a bare id without a URL', () => {
    expect(parseYouTubeVideoID(ID)).toBeUndefined();
  });

  it('rejects an empty string', () => {
    expect(parseYouTubeVideoID('')).toBeUndefined();
  });

  it('rejects a malformed URL string', () => {
    expect(parseYouTubeVideoID('not a url')).toBeUndefined();
  });
});
