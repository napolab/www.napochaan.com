import { describe, expect, it } from 'vitest';

import { FENCE_END, FENCE_START, MEDIA_LINE, POSTER_REF, VIDEO_FENCE, fenceBodyLines } from '.';

describe('fenceBodyLines', () => {
  it('trims whitespace around each line', () => {
    expect(fenceBodyLines('  ![media:1](a)  ')).toEqual(['![media:1](a)']);
  });

  it('drops blank lines', () => {
    expect(fenceBodyLines('\n\n![media:1](a)\n\n')).toEqual(['![media:1](a)']);
  });

  it('returns an empty array for whitespace-only input', () => {
    expect(fenceBodyLines('\n  \n\t\n')).toEqual([]);
  });
});

describe('FENCE_START', () => {
  it('matches the opening fence with variant=ambient', () => {
    const match = '```video variant=ambient'.match(FENCE_START);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('variant=ambient');
  });

  it('matches the opening fence with variant=player and a poster ref', () => {
    const match = '```video variant=player poster=media:5'.match(FENCE_START);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('variant=player poster=media:5');
  });

  it('matches the opening fence with no props (variant omitted)', () => {
    const match = '```video'.match(FENCE_START);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBeUndefined();
  });

  it('matches with trailing spaces', () => {
    expect(FENCE_START.test('```video variant=ambient   ')).toBe(true);
  });

  it('does not match a similarly-named fence', () => {
    expect(FENCE_START.test('```videos')).toBe(false);
  });
});

describe('FENCE_END', () => {
  it('matches a bare closing fence', () => {
    expect(FENCE_END.test('```')).toBe(true);
  });

  it('matches a closing fence with trailing spaces', () => {
    expect(FENCE_END.test('```   ')).toBe(true);
  });

  it('does not match a line with content after the fence', () => {
    expect(FENCE_END.test('```video')).toBe(false);
  });
});

describe('MEDIA_LINE', () => {
  it('captures id and caption', () => {
    const match = '![media:79](left cap)'.match(MEDIA_LINE);
    expect(match?.[1]).toBe('79');
    expect(match?.[2]).toBe('left cap');
  });

  it('captures id with an empty caption', () => {
    const match = '![media:78]()'.match(MEDIA_LINE);
    expect(match?.[1]).toBe('78');
    expect(match?.[2]).toBe('');
  });

  it('captures id when the line has leading whitespace', () => {
    const match = '   ![media:5](x)'.match(MEDIA_LINE);
    expect(match?.[1]).toBe('5');
    expect(match?.[2]).toBe('x');
  });

  it('does not match a non-media line', () => {
    expect(MEDIA_LINE.test('not a video')).toBe(false);
  });
});

describe('POSTER_REF', () => {
  it('captures the media id', () => {
    const match = 'media:42'.match(POSTER_REF);
    expect(match?.[1]).toBe('42');
  });

  it('does not match a bare id', () => {
    expect(POSTER_REF.test('42')).toBe(false);
  });
});

describe('VIDEO_FENCE', () => {
  it('extracts fence inner content from a multi-block document', () => {
    const md = ['intro', '', '```video variant=ambient', '![media:79](a)', '```', '', 'outro', '', '```video variant=player poster=media:2', '![media:1](b)', '```'].join('\n');
    const matches = [...md.matchAll(VIDEO_FENCE)];
    expect(matches.length).toBe(2);
    expect(matches[0]?.[1]).toBe('![media:79](a)\n');
    expect(matches[1]?.[1]).toBe('![media:1](b)\n');
  });

  it('extracts the body correctly for a bare fence with no props (regression: props group must not swallow the body line)', () => {
    const md = ['```video', '![media:79]()', '```'].join('\n');
    const matches = [...md.matchAll(VIDEO_FENCE)];
    expect(matches.length).toBe(1);
    expect(matches[0]?.[1]).toBe('![media:79]()\n');
  });

  it('does not swallow a following line into the fence match (regression: closing `$` must not eat the next newline)', () => {
    const md = ['```video variant=ambient', '![media:79](a)', '```', '', 'outro'].join('\n');
    const [match] = [...md.matchAll(VIDEO_FENCE)];
    expect(match?.[0]).toBe('```video variant=ambient\n![media:79](a)\n```');
    expect(md.slice(match?.[0].length ?? 0)).toBe('\n\noutro');
  });

  it('does not match a malformed start line like ```videofoo (regression: fourcc boundary must match FENCE_START rejection)', () => {
    const md = ['```videofoo', '![media:79]()', '```'].join('\n');
    expect([...md.matchAll(VIDEO_FENCE)]).toEqual([]);
  });
});
