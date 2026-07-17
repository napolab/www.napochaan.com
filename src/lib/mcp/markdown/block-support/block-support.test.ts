import { describe, expect, it } from 'vitest';

import { stripAllFences } from '.';

import type { McpBlockSupport } from '.';

const makePlugin = (blockType: string, stripFences: (markdown: string) => string): McpBlockSupport => ({
  blockType,
  syntaxHelp: '',
  stripFences,
  validateFences: () => [],
  extractMediaIDs: () => [],
});

describe('stripAllFences', () => {
  it('applies a single plugin', () => {
    const plugin = makePlugin('a', (markdown) => markdown.replace('[a]', ''));
    expect(stripAllFences([plugin], 'x[a]y')).toBe('xy');
  });

  it('applies multiple plugins in order', () => {
    const stripA = makePlugin('a', (markdown) => markdown.replace('[a]', ''));
    const stripB = makePlugin('b', (markdown) => markdown.replace('[b]', ''));
    expect(stripAllFences([stripA, stripB], 'x[a]y[b]z')).toBe('xyz');
  });

  it('feeds each plugin the previous plugin output', () => {
    const upper = makePlugin('a', (markdown) => markdown.toUpperCase());
    const stripMarker = makePlugin('b', (markdown) => markdown.replace('MARKER', ''));
    expect(stripAllFences([upper, stripMarker], 'markerX')).toBe('X');
  });

  it('returns the input unchanged when the plugin list is empty', () => {
    expect(stripAllFences([], 'unchanged')).toBe('unchanged');
  });
});
