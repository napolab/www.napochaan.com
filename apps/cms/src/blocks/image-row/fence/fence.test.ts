import { describe, expect, it } from 'vitest';

import { CELL_LINE, FENCE_END, FENCE_START, fenceCellLines, IMAGE_ROW_FENCE } from '.';

describe('fenceCellLines', () => {
  it('trims whitespace around each line', () => {
    expect(fenceCellLines('  ![media:1](a)  \n  ![media:2](b)  ')).toEqual(['![media:1](a)', '![media:2](b)']);
  });

  it('drops blank lines', () => {
    expect(fenceCellLines('![media:1](a)\n\n\n![media:2](b)\n')).toEqual(['![media:1](a)', '![media:2](b)']);
  });

  it('returns an empty array for whitespace-only input', () => {
    expect(fenceCellLines('\n  \n\t\n')).toEqual([]);
  });
});

describe('FENCE_START', () => {
  it('matches the opening fence with no trailing spaces', () => {
    expect(FENCE_START.test('```image-row')).toBe(true);
  });

  it('matches the opening fence with trailing spaces', () => {
    expect(FENCE_START.test('```image-row   ')).toBe(true);
  });

  it('does not match a similarly-named fence', () => {
    expect(FENCE_START.test('```image-rows')).toBe(false);
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
    expect(FENCE_END.test('```image-row')).toBe(false);
  });
});

describe('CELL_LINE', () => {
  it('captures id and caption', () => {
    const match = '![media:79](left cap)'.match(CELL_LINE);
    expect(match?.[1]).toBe('79');
    expect(match?.[2]).toBe('left cap');
  });

  it('captures id with an empty caption', () => {
    const match = '![media:78]()'.match(CELL_LINE);
    expect(match?.[1]).toBe('78');
    expect(match?.[2]).toBe('');
  });

  it('captures id when the line has leading whitespace', () => {
    const match = '   ![media:5](x)'.match(CELL_LINE);
    expect(match?.[1]).toBe('5');
    expect(match?.[2]).toBe('x');
  });

  it('does not match a non-cell line', () => {
    expect(CELL_LINE.test('not an image')).toBe(false);
  });
});

describe('IMAGE_ROW_FENCE', () => {
  it('extracts fence inner content from a multi-block document', () => {
    const md = ['intro', '', '```image-row', '![media:79](left)', '![media:78]()', '```', '', 'outro', '', '```image-row', '![media:1]()', '![media:2]()', '```'].join('\n');
    const matches = [...md.matchAll(IMAGE_ROW_FENCE)];
    expect(matches.length).toBe(2);
    expect(matches[0]?.[1]).toBe('![media:79](left)\n![media:78]()\n');
    expect(matches[1]?.[1]).toBe('![media:1]()\n![media:2]()\n');
  });
});
