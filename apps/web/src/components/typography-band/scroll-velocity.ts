// Scroll velocity with ScrollTrigger.getVelocity() semantics (gsap 3.15 ScrollTrigger.js
// `_updateAll` / `self.update` / `self.getVelocity`), so the band's VELOCITY_SCALE keeps
// its meaning without the 17KB plugin:
//
// - a sample (position + time) is RECORDED only when ≥50ms passed since the last one;
// - the velocity is measured from the sample BEFORE the latest one to now, in px/s,
//   signed by scroll direction (down = positive);
// - `onUpdate` fires only when the position actually changed — `sample` returns
//   undefined otherwise (the sample is still recorded, like ScrollTrigger's idle sync).
const RECORD_INTERVAL_MS = 50;

type Sample = { scroll: number; time: number };

export type ScrollVelocity = {
  sample: (scroll: number, time: number) => number | undefined;
};

// Seeded with the position at bind (ScrollTrigger.create refreshes scroll1 = scroll2 to
// the current scroll) — both samples start there.
export const createScrollVelocity = (scroll: number, time: number): ScrollVelocity => {
  const state: { latest: Sample; previous: Sample; seen: number } = {
    latest: { scroll, time },
    previous: { scroll, time },
    seen: scroll,
  };

  const record = (next: Sample) => {
    if (next.time - state.latest.time < RECORD_INTERVAL_MS) return;
    state.previous = state.latest;
    state.latest = next;
  };

  const measure = (next: Sample) => {
    const elapsed = next.time - state.previous.time;
    if (elapsed <= 0) return 0;
    return ((next.scroll - state.previous.scroll) / elapsed) * 1000;
  };

  return {
    sample: (nextScroll, nextTime) => {
      const next = { scroll: nextScroll, time: nextTime };
      record(next);
      if (nextScroll === state.seen) return undefined;
      state.seen = nextScroll;
      return measure(next);
    },
  };
};
