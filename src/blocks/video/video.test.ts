import { describe, expect, it } from 'vitest';

import { Video } from '.';

describe('Video.jsx.import', () => {
  it('parses an ambient variant with a caption', () => {
    const result = Video.jsx.import({ children: '![media:79](a cool clip)', props: { variant: 'ambient' } });
    if (result === false) throw new Error('expected fields, got false');

    expect(result.video).toBe(79);
    expect(result.variant).toBe('ambient');
    expect(result.caption).toBe('a cool clip');
    expect(result.poster).toBeUndefined();
  });

  it('parses a player variant with a poster ref', () => {
    const result = Video.jsx.import({ children: '![media:79]()', props: { variant: 'player', poster: 'media:5' } });
    if (result === false) throw new Error('expected fields, got false');

    expect(result.video).toBe(79);
    expect(result.variant).toBe('player');
    expect(result.caption).toBeUndefined();
    expect(result.poster).toBe(5);
  });

  it('defaults to ambient when variant is missing', () => {
    const result = Video.jsx.import({ children: '![media:79]()', props: {} });
    if (result === false) throw new Error('expected fields, got false');

    expect(result.variant).toBe('ambient');
  });

  it('ignores a poster ref when the variant is ambient', () => {
    const result = Video.jsx.import({ children: '![media:79]()', props: { variant: 'ambient', poster: 'media:5' } });
    if (result === false) throw new Error('expected fields, got false');

    expect(result.poster).toBeUndefined();
  });

  it('rejects an empty-caption line with no whitespace trimmed to nothing', () => {
    const result = Video.jsx.import({ children: '![media:79]()', props: { variant: 'ambient' } });
    if (result === false) throw new Error('expected fields, got false');

    expect(result.caption).toBeUndefined();
  });

  it('rejects a fence with no body line', () => {
    expect(Video.jsx.import({ children: '', props: { variant: 'ambient' } })).toBe(false);
  });

  it('rejects a fence with more than one line', () => {
    expect(Video.jsx.import({ children: '![media:79]()\n![media:78]()', props: { variant: 'ambient' } })).toBe(false);
  });

  it('rejects a non-media line', () => {
    expect(Video.jsx.import({ children: 'not a media line', props: { variant: 'ambient' } })).toBe(false);
  });

  it('rejects a line with a non-numeric media id', () => {
    expect(Video.jsx.import({ children: '![media:abc]()', props: { variant: 'ambient' } })).toBe(false);
  });
});

describe('Video.jsx.export', () => {
  it('serializes an ambient variant with raw numeric ids', () => {
    const markdown = Video.jsx.export({ fields: { video: 79, variant: 'ambient', caption: 'a cool clip' } });
    expect(markdown).toBe('```video variant=ambient\n![media:79](a cool clip)\n```');
  });

  it('serializes a player variant with a poster attribute', () => {
    const markdown = Video.jsx.export({ fields: { video: 79, variant: 'player', poster: 5 } });
    expect(markdown).toBe('```video variant=player poster=media:5\n![media:79]()\n```');
  });

  it('omits the poster attribute for the ambient variant even if a poster is set', () => {
    const markdown = Video.jsx.export({ fields: { video: 79, variant: 'ambient', poster: 5 } });
    expect(markdown).toBe('```video variant=ambient\n![media:79]()\n```');
  });

  it('serializes populated media docs ({ id })', () => {
    const markdown = Video.jsx.export({ fields: { video: { id: 79 }, variant: 'player', poster: { id: 5 } } });
    expect(markdown).toContain('![media:79]()');
    expect(markdown).toContain('poster=media:5');
  });

  it('returns false when the video field cannot be resolved to an id', () => {
    expect(Video.jsx.export({ fields: { variant: 'ambient' } })).toBe(false);
  });
});
