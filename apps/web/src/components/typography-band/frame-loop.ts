// A requestAnimationFrame loop that hands each frame the ms elapsed since the previous
// one — the replacement for `gsap.ticker.add((time, deltaMs) => …)`. Like gsap's ticker,
// time is read with performance.now() inside the callback (not the rAF timestamp, which
// can precede the bind time and read as a negative first gap), and gaps are lag-smoothed.
const LAG_THRESHOLD_MS = 500;
const ADJUSTED_LAG_MS = 33;

// gsap's default `ticker.lagSmoothing(500, 33)`: a gap over 500ms (hidden tab, a long
// main-thread stall) or a clock running backwards advances time by 33ms only, so the
// drift / a tween never jumps after the tab comes back.
export const smoothLag = (elapsedMs: number): number => {
  if (elapsedMs > LAG_THRESHOLD_MS || elapsedMs < 0) return ADJUSTED_LAG_MS;
  return elapsedMs;
};

// Starts immediately (the first frame's delta is measured from now) and returns a
// synchronous stop — safe to call from inside `onFrame` itself.
export const startFrameLoop = (onFrame: (deltaMs: number) => void): (() => void) => {
  const state = { last: performance.now(), id: 0 };

  const frame = () => {
    const now = performance.now();
    const delta = smoothLag(now - state.last);
    state.last = now;
    // Request the next frame before dispatching (gsap's ticker does the same), so a
    // stop() from inside onFrame cancels it.
    state.id = requestAnimationFrame(frame);
    onFrame(delta);
  };
  state.id = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(state.id);
  };
};
