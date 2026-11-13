// Framework-free typewriter controller, shared by the React `useTypewriter` hook and
// the `<typewriter-text>` / `<boot-question>` custom elements. One module, so the
// cadence and the fumbles can never drift between the two.

export type TypewriterSnapshot = {
  displayText: string;
  isDone: boolean;
};

export const INITIAL_SNAPSHOT: TypewriterSnapshot = { displayText: '', isDone: false };

// Plausible mistype characters typed during a "thinking" fumble before correction.
const WRONG_CHARS = 'あいうえおかきくけこさしすせそたちつてとabcdefghijklmnopqrstuvwxyz0123456789';
const randomWrong = () => WRONG_CHARS[Math.floor(Math.random() * WRONG_CHARS.length)];

type Phase = 'typing' | 'mistyping' | 'thinking' | 'deleting';

export type TypewriterOptions = {
  speed: number;
  jitter: number; // 0..1 fraction of speed randomly added/removed per keystroke
  typoChance: number; // probability of a typo fumble per keystroke
  pauseChance: number; // probability of a longer pause per keystroke
};

export const TYPEWRITER_DEFAULTS: TypewriterOptions = { speed: 46, jitter: 0.6, typoChance: 0.08, pauseChance: 0.06 };

export type Typewriter = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => TypewriterSnapshot;
  getServerSnapshot: () => TypewriterSnapshot;
  // Begins (or resumes) typing; a no-op while a keystroke is pending or once done.
  start: () => void;
  // Jumps to the full text (reduced motion).
  finish: () => void;
  // Freezes on the current keystroke; start() resumes from there.
  stop: () => void;
};

// Controller pattern (cf. Booth2Booth use-typewriter): an external store driven by an
// imperative timer that types like a human who thinks as they go — variable cadence,
// pauses, and the occasional fumble where it types a few wrong chars, hesitates, then
// backspaces and corrects. Mutable cells live in a const object (no `let`).
export const createTypewriter = (fullText: string, options: TypewriterOptions = TYPEWRITER_DEFAULTS): Typewriter => {
  const { speed, jitter, typoChance, pauseChance } = options;
  const listeners = new Set<() => void>();
  const state = { snapshot: INITIAL_SNAPSHOT };
  // index = correct chars committed; wrong = fumbled chars currently shown.
  const m = { index: 0, wrong: '', target: 0, phase: 'typing' as Phase, timer: undefined as ReturnType<typeof setTimeout> | undefined };

  const emit = (isDone: boolean) => {
    state.snapshot = { displayText: fullText.slice(0, m.index) + m.wrong, isDone };
    for (const listener of listeners) listener();
  };

  const nextDelay = () => {
    const base = speed * (1 - jitter + Math.random() * jitter * 2);
    return Math.random() < pauseChance ? base + 267 + Math.random() * 383 : base;
  };

  const schedule = (delay: number) => {
    m.timer = setTimeout(tick, delay);
  };

  const tick = () => {
    m.timer = undefined;
    switch (m.phase) {
      case 'mistyping': {
        if (m.wrong.length < m.target) {
          m.wrong += randomWrong();
          emit(false);
          schedule(speed * (0.25 + Math.random() * 0.35));
          return;
        }
        // hesitate — "...あれ？"
        m.phase = 'thinking';
        schedule(350 + Math.random() * 467);
        return;
      }
      case 'thinking': {
        m.phase = 'deleting';
        schedule(speed * 0.9);
        return;
      }
      case 'deleting': {
        if (m.wrong.length > 0) {
          m.wrong = m.wrong.slice(0, -1);
          emit(false);
          schedule(speed * 0.5);
          return;
        }
        m.phase = 'typing';
        schedule(speed * 1.2);
        return;
      }
      case 'typing': {
        if (m.index >= fullText.length) {
          emit(true);
          return;
        }
        const nextChar = fullText[m.index];
        if (nextChar !== ' ' && m.index < fullText.length - 1 && Math.random() < typoChance) {
          m.phase = 'mistyping';
          m.target = 2 + Math.floor(Math.random() * 3); // fumble 2–4 wrong chars
          schedule(speed * 0.7);
          return;
        }
        m.index += 1;
        emit(false);
        schedule(nextDelay());
      }
    }
  };

  const clear = () => {
    if (m.timer !== undefined) clearTimeout(m.timer);
    m.timer = undefined;
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state.snapshot,
    getServerSnapshot: () => INITIAL_SNAPSHOT,
    start: () => {
      if (m.timer === undefined && !state.snapshot.isDone) tick();
    },
    finish: () => {
      clear();
      m.index = fullText.length;
      m.wrong = '';
      m.phase = 'typing';
      emit(true);
    },
    stop: clear,
  };
};
