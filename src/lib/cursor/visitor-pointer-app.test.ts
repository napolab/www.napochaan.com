import { describe, expect, it } from 'vitest';

import { applyMessage, fell, hasPeers, rose, type VisitorPointerState } from './visitor-pointer-app';

const empty = (): VisitorPointerState => ({ visitors: new Map(), count: 0 });

describe('applyMessage', () => {
  it('count sets the count', () => {
    expect(applyMessage(empty(), { t: 'count', n: 3 }).count).toBe(3);
  });
  it('count updates count, preserves visitors, and returns a changed reference', () => {
    const visitor = { id: 'a', color: 'blue', label: '#a', x: 0.1, y: 0.2 } as const;
    const state: VisitorPointerState = { visitors: new Map([['a', visitor]]), count: 1 };
    const next = applyMessage(state, { t: 'count', n: 3 });
    expect(next).not.toBe(state);
    expect(next.count).toBe(3);
    expect(next.visitors).toBe(state.visitors);
    expect(next.visitors.get('a')).toBe(visitor);
  });
  it('join adds a visitor with no position yet, then move sets its position', () => {
    const joined = applyMessage(empty(), { t: 'join', id: 'a', color: 'blue', label: '#a' });
    expect(joined.visitors.get('a')).toEqual({ id: 'a', color: 'blue', label: '#a', x: undefined, y: undefined });
    const moved = applyMessage(joined, { t: 'move', id: 'a', x: 0.2, y: 0.8 });
    expect(moved.visitors.get('a')).toMatchObject({ x: 0.2, y: 0.8 });
  });
  it('move for an unknown id is ignored (same reference)', () => {
    const s = empty();
    expect(applyMessage(s, { t: 'move', id: 'x', x: 0.1, y: 0.1 })).toBe(s);
  });
  it('leave removes the visitor', () => {
    const joined = applyMessage(empty(), { t: 'join', id: 'a', color: 'red', label: '#a' });
    expect(applyMessage(joined, { t: 'leave', id: 'a' }).visitors.has('a')).toBe(false);
  });
});

describe('hasPeers', () => {
  it('is false when alone (count < 2)', () => {
    expect(hasPeers(0)).toBe(false);
    expect(hasPeers(1)).toBe(false);
  });
  it('is true when a peer is present (count >= 2)', () => {
    expect(hasPeers(2)).toBe(true);
    expect(hasPeers(3)).toBe(true);
  });
});

describe('rose', () => {
  it('is true when the predicate flips false -> true', () => {
    expect(rose(hasPeers, 1, 2)).toBe(true);
    expect(rose(hasPeers, 0, 2)).toBe(true);
  });
  it('is false otherwise', () => {
    expect(rose(hasPeers, 2, 3)).toBe(false); // already true
    expect(rose(hasPeers, 2, 1)).toBe(false); // falling, not rising
    expect(rose(hasPeers, 1, 1)).toBe(false); // still false
    expect(rose(hasPeers, 0, 1)).toBe(false); // still false
  });
});

describe('fell', () => {
  it('is true when the predicate flips true -> false', () => {
    expect(fell(hasPeers, 2, 1)).toBe(true);
    expect(fell(hasPeers, 2, 0)).toBe(true);
  });
  it('is false otherwise', () => {
    expect(fell(hasPeers, 1, 2)).toBe(false); // rising, not falling
    expect(fell(hasPeers, 3, 2)).toBe(false); // still true
    expect(fell(hasPeers, 1, 1)).toBe(false); // still false
    expect(fell(hasPeers, 1, 0)).toBe(false); // still false
  });
});
