import { describe, expect, it } from 'vitest';

import { createScrollVelocity } from './scroll-velocity';

// Mirrors ScrollTrigger.getVelocity() as read inside onUpdate (gsap 3.15
// ScrollTrigger.js `_updateAll` / `self.update` / `self.getVelocity`): a sample is
// recorded only when ≥50ms passed since the previous one, and the velocity is measured
// against the sample BEFORE the latest — px/s, signed by scroll direction.
describe('createScrollVelocity', () => {
  it('measures px/s against the previous recorded sample', () => {
    const velocity = createScrollVelocity(0, 0);

    expect(velocity.sample(100, 100)).toBe(1000);
  });

  it('does not record a new sample within 50ms of the last one', () => {
    const velocity = createScrollVelocity(0, 0);
    velocity.sample(100, 100); // recorded: previous = (0, 0), latest = (100, 100)

    // < 50ms since t=100: still measured against (0, 0)
    expect(velocity.sample(110, 120)).toBeCloseTo((110 / 120) * 1000, 6);
  });

  it('is negative when scrolling up', () => {
    const velocity = createScrollVelocity(0, 0);
    velocity.sample(100, 100);

    // recorded: previous = (100, 100) → (50 - 100) / (200 - 100) s
    expect(velocity.sample(50, 200)).toBe(-500);
  });

  it('reports no update (undefined) when the position did not change', () => {
    const velocity = createScrollVelocity(40, 0);

    expect(velocity.sample(40, 100)).toBeUndefined();
  });

  it('still records an unchanged sample, so an idle refresh moves the baseline', () => {
    const velocity = createScrollVelocity(0, 0);
    velocity.sample(0, 1000); // idle refresh: recorded, no update

    // previous = (0, 1000) → 60px over 60ms, not over 1060ms
    expect(velocity.sample(60, 1060)).toBe(1000);
  });

  it('is 0, not Infinity, when no time has passed', () => {
    const velocity = createScrollVelocity(0, 0);

    expect(velocity.sample(10, 0)).toBe(0);
  });
});
