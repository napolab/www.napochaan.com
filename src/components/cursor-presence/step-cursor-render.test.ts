import { describe, expect, it } from 'vitest';

import { stepCursorRender, type CursorRender, type StepConfig } from './step-cursor-render';

const config: StepConfig = { lerp: 0.25, alphaLerp: 0.1, idleMs: 5000, reduceMotion: false };

describe('stepCursorRender', () => {
  it('seeds a new cursor at the target, fully opaque, stamping movedAt to now', () => {
    const next = stepCursorRender({ prev: undefined, nx: 0.5, ny: 0.5, targetX: 100, targetY: 80, now: 1000 }, config);

    expect(next).toEqual<CursorRender>({ x: 100, y: 80, alpha: 1, seeded: true, movedAt: 1000, nx: 0.5, ny: 0.5 });
  });

  it('lerps the on-screen position toward the target once seeded', () => {
    const prev: CursorRender = { x: 0, y: 0, alpha: 1, seeded: true, movedAt: 0, nx: 0.5, ny: 0.5 };
    const next = stepCursorRender({ prev, nx: 0.5, ny: 0.5, targetX: 100, targetY: 200, now: 1 }, config);

    expect(next.x).toBeCloseTo(25);
    expect(next.y).toBeCloseTo(50);
  });

  it('fades alpha toward 0 once idle beyond the threshold without re-snapping position', () => {
    const prev: CursorRender = { x: 100, y: 80, alpha: 1, seeded: true, movedAt: 0, nx: 0.5, ny: 0.5 };
    const next = stepCursorRender({ prev, nx: 0.5, ny: 0.5, targetX: 100, targetY: 80, now: 6000 }, config);

    expect(next.movedAt).toBe(0); // unchanged: position never moved
    expect(next.alpha).toBeLessThan(1);
    expect(next.alpha).toBeCloseTo(0.9); // 1 + (0 - 1) * 0.1
  });

  it('stays fully opaque while idle is still under the threshold', () => {
    const prev: CursorRender = { x: 100, y: 80, alpha: 1, seeded: true, movedAt: 0, nx: 0.5, ny: 0.5 };
    const next = stepCursorRender({ prev, nx: 0.5, ny: 0.5, targetX: 100, targetY: 80, now: 4999 }, config);

    expect(next.alpha).toBe(1);
  });

  it('resets movedAt and fades alpha back up when the pointer moves again', () => {
    const prev: CursorRender = { x: 100, y: 80, alpha: 0.2, seeded: true, movedAt: 0, nx: 0.5, ny: 0.5 };
    const next = stepCursorRender({ prev, nx: 0.6, ny: 0.5, targetX: 120, targetY: 80, now: 9000 }, config);

    expect(next.movedAt).toBe(9000);
    expect(next.alpha).toBeGreaterThan(0.2); // climbing back toward 1
    expect(next.alpha).toBeCloseTo(0.28); // 0.2 + (1 - 0.2) * 0.1
  });

  it('with reduce motion, snaps position and hides instantly instead of lerping', () => {
    const reduced: StepConfig = { ...config, reduceMotion: true };
    const prev: CursorRender = { x: 0, y: 0, alpha: 1, seeded: true, movedAt: 0, nx: 0.5, ny: 0.5 };
    const next = stepCursorRender({ prev, nx: 0.5, ny: 0.5, targetX: 100, targetY: 200, now: 6000 }, reduced);

    expect(next.x).toBe(100); // snapped, not lerped
    expect(next.y).toBe(200);
    expect(next.alpha).toBe(0); // hidden instantly, no fade
  });
});
