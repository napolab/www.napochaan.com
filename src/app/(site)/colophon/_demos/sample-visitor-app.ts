import type { CursorColor } from '@lib/cursor/identity';
import type { Visitor, VisitorPointerApp, VisitorPointerState } from '@lib/cursor/visitor-pointer-app';

type Point = { x: number; y: number };
type Spec = { id: string; color: CursorColor; label: string; waypoints: Point[] };

// Waypoints stay left-of-center (x ≤ ~0.5) so each right-side label chip fits.
const SPECS: Spec[] = [
  {
    id: 'sample-a',
    color: 'blue',
    label: 'napochaan',
    waypoints: [
      { x: 0.12, y: 0.24 },
      { x: 0.48, y: 0.3 },
      { x: 0.4, y: 0.66 },
      { x: 0.16, y: 0.56 },
    ],
  },
  {
    id: 'sample-b',
    color: 'magenta',
    label: '#7f2a',
    waypoints: [
      { x: 0.46, y: 0.6 },
      { x: 0.2, y: 0.7 },
      { x: 0.14, y: 0.34 },
      { x: 0.44, y: 0.22 },
    ],
  },
];

// One visitor steps every STEP_MS; the two are staggered by advancing one per tick.
const STEP_MS = 1100;

const visitorAt = (spec: Spec, idx: number): Visitor => {
  const wp = spec.waypoints[idx % spec.waypoints.length] ?? { x: 0.2, y: 0.4 };

  return { id: spec.id, color: spec.color, label: spec.label, x: wp.x, y: wp.y };
};

const buildState = (indices: ReadonlyMap<string, number>): VisitorPointerState => {
  const visitors = new Map<string, Visitor>();
  for (const spec of SPECS) {
    visitors.set(spec.id, visitorAt(spec, indices.get(spec.id) ?? 0));
  }

  return { visitors, count: SPECS.length };
};

// A socket-free VisitorPointerApp: two autonomous visitors hop between waypoints on
// a timer (one per tick, so they stagger). CursorLayer's per-frame lerp turns each
// hop into a brisk dart-then-rest, so the real rendering path produces the motion —
// no custom draw loop. Used by the colophon catalog to run the live CursorLayer in
// a cell.
export const createSampleVisitorApp = (): VisitorPointerApp => {
  const indices = new Map<string, number>(SPECS.map((spec) => [spec.id, 0]));
  const store: { state: VisitorPointerState } = { state: buildState(indices) };
  const listeners = new Set<(state: VisitorPointerState) => void>();
  const timer: { id: ReturnType<typeof setInterval> | undefined; tick: number } = { id: undefined, tick: 0 };

  const notify = (): void => {
    store.state = buildState(indices);
    for (const listener of listeners) listener(store.state);
  };

  // Advance one visitor per interval so the two never move in lockstep.
  const advance = (): void => {
    const spec = SPECS[timer.tick % SPECS.length];
    timer.tick += 1;
    if (spec === undefined) return;
    indices.set(spec.id, ((indices.get(spec.id) ?? 0) + 1) % spec.waypoints.length);
    notify();
  };

  return {
    start() {
      if (timer.id !== undefined) return;
      timer.id = setInterval(advance, STEP_MS / SPECS.length);
    },
    end() {
      if (timer.id === undefined) return;
      clearInterval(timer.id);
      timer.id = undefined;
    },
    setPath() {
      // no-op: the sample app is page-agnostic.
    },
    send() {
      // no-op: the sample app has no local cursor to broadcast.
    },
    getState() {
      return store.state;
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};
