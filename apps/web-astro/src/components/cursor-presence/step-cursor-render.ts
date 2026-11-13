// Per-cursor render state advanced once per animation frame. `x`/`y` are the interpolated on-screen
// px (canvas has no CSS transition, so we lerp by hand). `alpha` fades a cursor out after it sits
// idle and back in the moment it moves again. `movedAt` is the timestamp of the last pointer move
// (in `performance.now()` ms); `nx`/`ny` are the visitor's last-seen normalized input position —
// idle is judged from the visitor's own movement, not screen drift from page scroll.
export type CursorRender = {
  x: number;
  y: number;
  alpha: number;
  seeded: boolean;
  movedAt: number;
  nx: number;
  ny: number;
};

export type StepConfig = {
  lerp: number; // per-frame position follow factor toward the target
  alphaLerp: number; // per-frame opacity follow factor toward 0/1
  idleMs: number; // hide a cursor after it has been idle this long
  reduceMotion: boolean; // snap position and toggle opacity instantly, no interpolation
};

export type StepInput = {
  prev: CursorRender | undefined;
  nx: number; // visitor normalized input position (drives idle detection)
  ny: number;
  targetX: number; // placement-resolved on-screen px
  targetY: number;
  now: number; // performance.now()
};

// Pure frame step: derives the next render state from the previous one, the visitor's current
// normalized position, the resolved screen target, and the clock. A fresh cursor (no `prev`) and
// reduce-motion both snap position and set opacity directly; otherwise position and alpha lerp.
export const stepCursorRender = (input: StepInput, config: StepConfig): CursorRender => {
  const { prev, nx, ny, targetX, targetY, now } = input;
  const { lerp, alphaLerp, idleMs, reduceMotion } = config;

  const moved = prev === undefined || prev.nx !== nx || prev.ny !== ny;
  const movedAt = moved ? now : prev.movedAt;

  const snap = prev === undefined || reduceMotion || !prev.seeded;
  const x = snap ? targetX : prev.x + (targetX - prev.x) * lerp;
  const y = snap ? targetY : prev.y + (targetY - prev.y) * lerp;

  const targetAlpha = now - movedAt >= idleMs ? 0 : 1;
  const alpha = prev === undefined || reduceMotion ? targetAlpha : prev.alpha + (targetAlpha - prev.alpha) * alphaLerp;

  return { x, y, alpha, seeded: true, movedAt, nx, ny };
};
