import { describe, expect, it } from 'vitest';

import { applyMessage, type VisitorPointerState } from './visitor-pointer-app';

const empty = (): VisitorPointerState => ({ visitors: new Map(), count: 0 });

describe('applyMessage', () => {
  it('count sets the count', () => {
    expect(applyMessage(empty(), { t: 'count', n: 3 }).count).toBe(3);
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
