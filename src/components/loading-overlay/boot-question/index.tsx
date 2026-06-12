'use client';

import { useCallback, useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';
import { useTypewriter } from '@hooks/use-typewriter';

import { QUESTIONS } from '../questions';
import * as styles from '../styles.css';

// The boot overlay's typed prompt. This is the ONLY client island in the overlay
// — everything around it (frame, brand, progress bar) stays a Server Component.
// It cycles QUESTIONS in order forever: type one, hold, advance, repeat. It is
// intentionally NOT synced to the progress bar; the two animate independently.

// Pure cycle step, extracted so the wrap-around is unit-testable.
export const nextIndex = (current: number, length: number): number => (current + 1) % length;

// Pure shuffle (decorate–sort–undecorate): tag each item with a drawn key, sort by
// it, drop the key. `random` is injected so tests stay deterministic; production
// passes Math.random. Never mutates the input — the `map` builds a fresh array.
export const shuffle = <T,>(items: readonly T[], random: () => number): T[] =>
  items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);

// How long a finished prompt stays on screen before the next begins typing.
const HOLD_MS = 1800;

type LineProps = {
  text: string;
  onDone: () => void;
};

// One prompt's keystrokes. Remounted (via key) per cycle so the hook's controller
// restarts cleanly on the next prompt.
const Line = ({ text, onDone }: LineProps) => {
  const { displayText, isDone } = useTypewriter(text);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // USEEFFECT_JUSTIFICATION: imperative hold timer that paces the cycle — once a
    // prompt finishes typing, wait, then advance. Pure animation pacing, not state
    // sync. Under reduced motion the hook jumps to the full text immediately, and
    // we skip the timer so the cycle rests on a single prompt (no looping motion).
    if (!isDone || reduced) return undefined;
    const timer = setTimeout(onDone, HOLD_MS);
    return () => clearTimeout(timer);
  }, [isDone, reduced, onDone]);

  return (
    <>
      {displayText}
      <span className={styles.caret} />
    </>
  );
};

export const BootQuestion = () => {
  // Shuffle once per mount → a fresh order on every reload. Safe to randomise here:
  // useTypewriter paints empty text on the first frame (server + client alike), so
  // the picked order never reaches the DOM until after hydration — no mismatch.
  const [order] = useState(() => shuffle(QUESTIONS, Math.random));
  const [index, setIndex] = useState(0);
  const advance = useCallback(() => setIndex((current) => nextIndex(current, order.length)), [order.length]);
  const text = order[index] ?? QUESTIONS[0];

  return <Line key={index} text={text} onDone={advance} />;
};
