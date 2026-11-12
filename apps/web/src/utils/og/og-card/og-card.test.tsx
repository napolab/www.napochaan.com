import { describe, expect, it } from 'vitest';

import type { OgCardData } from '../resolve-og-card-data';
import { OgCard, SIZE } from './index';

// Recursively collect all string children in the element tree. Function-component
// elements (e.g. the extracted Field) are invoked so their output is traversed too.
const texts = (node: unknown): string[] => {
  if (typeof node === 'string') return [node];
  if (typeof node === 'number') return [`${node}`];
  if (Array.isArray(node)) return node.flatMap(texts);

  if (node !== null && typeof node === 'object' && 'type' in node && typeof (node as { type: unknown }).type === 'function') {
    const el = node as { type: (props: unknown) => unknown; props: unknown };

    return texts(el.type(el.props));
  }

  if (node !== null && typeof node === 'object' && 'props' in node) return texts((node as { props: { children?: unknown } }).props.children);

  return [];
};

const baseData: OgCardData = { label: 'NEWS', title: { chunks: ['サイトを', 'リニューアル'], truncated: false }, meta: '2026.06.11', hasImage: false };

describe('OgCard', () => {
  it('exposes the 1200x630 size', () => {
    expect(SIZE).toEqual({ width: 1200, height: 630 });
  });

  it('renders the label and every title chunk', () => {
    const tree = OgCard({ data: baseData, wordmarkUrl: 'data:img', board: { cells: [], alive: 0, cols: 1, rows: 1 } });
    const all = texts(tree).join('|');
    expect(all).toContain('NEWS');
    expect(all).toContain('サイトを');
    expect(all).toContain('リニューアル');
  });

  it('shows alive count from the board when there is no image', () => {
    const board = { cells: [{ x: 0, y: 0, red: false }], alive: 1, cols: 2, rows: 2 };
    const tree = OgCard({ data: baseData, wordmarkUrl: 'data:img', board });
    expect(texts(tree).join('|')).toContain('alive 1');
  });
});
