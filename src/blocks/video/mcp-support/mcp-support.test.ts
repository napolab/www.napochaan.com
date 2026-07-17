import { describe, expect, it } from 'vitest';

import { videoMcpSupport } from '.';

const FENCE_AMBIENT = ['```video variant=ambient', '![media:79](a cool clip)', '```'].join('\n');
const FENCE_PLAYER = ['```video variant=player poster=media:5', '![media:79]()', '```'].join('\n');

describe('videoMcpSupport.blockType', () => {
  it('is "video"', () => {
    expect(videoMcpSupport.blockType).toBe('video');
  });
});

describe('videoMcpSupport.stripFences', () => {
  it('removes a well-formed ambient fence entirely', () => {
    expect(videoMcpSupport.stripFences(FENCE_AMBIENT)).toBe('');
  });

  it('removes a well-formed player+poster fence entirely', () => {
    expect(videoMcpSupport.stripFences(FENCE_PLAYER)).toBe('');
  });

  it('keeps surrounding content while removing the fence', () => {
    const md = `intro\n\n${FENCE_AMBIENT}\n\noutro`;
    const stripped = videoMcpSupport.stripFences(md);
    expect(stripped).toContain('intro');
    expect(stripped).toContain('outro');
    expect(stripped).not.toContain('media:79');
  });

  it('leaves non-fence content untouched when there is no fence', () => {
    expect(videoMcpSupport.stripFences('# hi\n\npara')).toBe('# hi\n\npara');
  });

  it('preserves surrounding newlines exactly (regression: closing fence must not swallow the following blank line)', () => {
    const md = `intro\n\n${FENCE_AMBIENT}\n\noutro`;
    expect(videoMcpSupport.stripFences(md)).toBe('intro\n\n\n\noutro');
  });
});

describe('videoMcpSupport with a malformed ```videofoo start line', () => {
  const FENCE_MALFORMED = ['```videofoo', '![media:79]()', '```'].join('\n');

  it('is not recognized by stripFences (left untouched, same as any unknown fence type)', () => {
    expect(videoMcpSupport.stripFences(FENCE_MALFORMED)).toBe(FENCE_MALFORMED);
  });

  it('is not recognized by validateFences (no video-specific errors reported for an unrelated fence)', () => {
    expect(videoMcpSupport.validateFences(FENCE_MALFORMED)).toEqual([]);
  });

  it('is not recognized by extractMediaIDs (no media id extracted from an unrelated fence)', () => {
    expect(videoMcpSupport.extractMediaIDs(FENCE_MALFORMED)).toEqual([]);
  });
});

describe('videoMcpSupport.validateFences', () => {
  it('accepts a well-formed ambient fence', () => {
    expect(videoMcpSupport.validateFences(FENCE_AMBIENT)).toEqual([]);
  });

  it('accepts a well-formed player fence with a poster', () => {
    expect(videoMcpSupport.validateFences(FENCE_PLAYER)).toEqual([]);
  });

  it('accepts a player fence without a poster', () => {
    const fence = ['```video variant=player', '![media:79]()', '```'].join('\n');
    expect(videoMcpSupport.validateFences(fence)).toEqual([]);
  });

  it('accepts a fence with no variant attribute (defaults to ambient)', () => {
    const fence = ['```video', '![media:79]()', '```'].join('\n');
    expect(videoMcpSupport.validateFences(fence)).toEqual([]);
  });

  it('rejects a fence with no body line', () => {
    const bad = ['```video variant=ambient', '```'].join('\n');
    const errors = videoMcpSupport.validateFences(bad);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('1');
  });

  it('rejects a fence with more than one body line', () => {
    const bad = ['```video variant=ambient', '![media:79]()', '![media:78]()', '```'].join('\n');
    expect(videoMcpSupport.validateFences(bad).length).toBe(1);
  });

  it('rejects a fence with a non-media body line', () => {
    const bad = ['```video variant=ambient', 'not a media line', '```'].join('\n');
    expect(videoMcpSupport.validateFences(bad).length).toBe(1);
  });

  it('rejects an invalid variant value', () => {
    const bad = ['```video variant=loop', '![media:79]()', '```'].join('\n');
    const errors = videoMcpSupport.validateFences(bad);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('ambient');
    expect(errors[0]).toContain('player');
  });

  it('rejects a poster attribute on the ambient variant', () => {
    const bad = ['```video variant=ambient poster=media:5', '![media:79]()', '```'].join('\n');
    const errors = videoMcpSupport.validateFences(bad);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('player');
  });

  it('rejects a poster attribute with no variant attribute (implicit ambient)', () => {
    const bad = ['```video poster=media:5', '![media:79]()', '```'].join('\n');
    expect(videoMcpSupport.validateFences(bad).length).toBe(1);
  });

  it('rejects a poster attribute with an invalid value format', () => {
    const bad = ['```video variant=player poster=notmedia', '![media:79]()', '```'].join('\n');
    const errors = videoMcpSupport.validateFences(bad);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('poster');
  });

  it('accepts a valid poster value (media:<id>)', () => {
    const fence = ['```video variant=player poster=media:12', '![media:79]()', '```'].join('\n');
    expect(videoMcpSupport.validateFences(fence)).toEqual([]);
  });

  it('accepts a doc with no fences', () => {
    expect(videoMcpSupport.validateFences('# hi\n\npara')).toEqual([]);
  });

  it('reports multiple violations for the same fence independently', () => {
    const bad = ['```video variant=loop poster=media:5', 'not a media line', '```'].join('\n');
    expect(videoMcpSupport.validateFences(bad).length).toBe(3);
  });
});

describe('videoMcpSupport.extractMediaIDs', () => {
  it('lists the body media id for an ambient fence with no poster', () => {
    expect(videoMcpSupport.extractMediaIDs(FENCE_AMBIENT)).toEqual([79]);
  });

  it('lists both the body media id and the poster id for a player fence', () => {
    expect(videoMcpSupport.extractMediaIDs(FENCE_PLAYER)).toEqual([79, 5]);
  });

  it('lists ids across multiple fences', () => {
    const md = `${FENCE_AMBIENT}\n\n${FENCE_PLAYER}`;
    expect(videoMcpSupport.extractMediaIDs(md)).toEqual([79, 79, 5]);
  });

  it('returns empty for no fences', () => {
    expect(videoMcpSupport.extractMediaIDs('para')).toEqual([]);
  });

  it('excludes an invalid poster value from extracted ids (format validation is validateFences concern only)', () => {
    const fence = ['```video variant=player poster=notmedia', '![media:79]()', '```'].join('\n');
    expect(videoMcpSupport.extractMediaIDs(fence)).toEqual([79]);
  });
});

describe('videoMcpSupport.syntaxHelp', () => {
  it('documents the video fence syntax for the LLM', () => {
    expect(videoMcpSupport.syntaxHelp).toContain('```video');
    expect(videoMcpSupport.syntaxHelp).toContain('![media:');
  });

  it('documents variant semantics', () => {
    expect(videoMcpSupport.syntaxHelp).toContain('ambient');
    expect(videoMcpSupport.syntaxHelp).toContain('player');
  });

  it('documents poster is player-only', () => {
    expect(videoMcpSupport.syntaxHelp).toContain('poster');
  });
});
