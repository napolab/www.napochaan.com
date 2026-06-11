'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';

type Snapshot = {
  displayText: string;
  isDone: boolean;
};

const INITIAL: Snapshot = { displayText: '', isDone: false };

// Plausible mistype characters typed during a "thinking" fumble before correction.
const WRONG_CHARS = 'あいうえおかきくけこさしすせそたちつてとabcdefghijklmnopqrstuvwxyz0123456789';
const randomWrong = () => WRONG_CHARS[Math.floor(Math.random() * WRONG_CHARS.length)];

type Phase = 'typing' | 'mistyping' | 'thinking' | 'deleting';

type Options = {
  speed: number;
  jitter: number; // 0..1 fraction of speed randomly added/removed per keystroke
  typoChance: number; // probability of a typo fumble per keystroke
  pauseChance: number; // probability of a longer pause per keystroke
};

// Controller pattern (cf. Booth2Booth use-typewriter): an external store read via
// useSyncExternalStore, driven by an imperative timer that types like a human who
// thinks as they go — variable cadence, pauses, and the occasional fumble where it
// types a few wrong chars, hesitates, then backspaces and corrects. Mutable cells
// live in a const object (no `let`).
const createTypewriter = (fullText: string, options: Options) => {
  const { speed, jitter, typoChance, pauseChance } = options;
  const listeners = new Set<() => void>();
  const state = { snapshot: INITIAL };
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
      default: {
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

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state.snapshot,
    getServerSnapshot: () => INITIAL,
    start: () => {
      if (m.timer === undefined && !state.snapshot.isDone) tick();
    },
    finish: () => {
      if (m.timer !== undefined) clearTimeout(m.timer);
      m.timer = undefined;
      m.index = fullText.length;
      m.wrong = '';
      emit(true);
    },
    stop: () => {
      if (m.timer !== undefined) clearTimeout(m.timer);
      m.timer = undefined;
    },
  };
};

type UseTypewriterOptions = {
  speed?: number;
  jitter?: number;
  typoChance?: number;
  pauseChance?: number;
  startWhen?: boolean;
};

export const useTypewriter = (fullText: string, options: UseTypewriterOptions = {}): Snapshot => {
  const { speed = 46, jitter = 0.6, typoChance = 0.08, pauseChance = 0.06, startWhen = true } = options;
  const [controller] = useState(() => createTypewriter(fullText, { speed, jitter, typoChance, pauseChance }));
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getServerSnapshot);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative typewriter timer — starts the reveal on
    // mount (jumping to the full text under reduced-motion) and clears it on unmount.
    if (!startWhen) return;
    if (reduced) {
      controller.finish();
      return;
    }
    controller.start();
    return controller.stop;
  }, [controller, startWhen, reduced]);

  return snapshot;
};
