// Rate-limits a stream of values: emits at most once per `intervalMs`, always with the LATEST
// value, on both the leading edge (when enough time has passed) and the trailing edge (the latest
// buffered value is flushed when the interval elapses). Used to keep pointermove (~60/s) from
// flooding the socket. `cancel()` drops a pending trailing emit (call on teardown).
export type TrailingThrottle<T> = {
  push: (value: T) => void;
  cancel: () => void;
};

export const createTrailingThrottle = <T>(intervalMs: number, emit: (value: T) => void): TrailingThrottle<T> => {
  // Buffer of pushed values; only the last matters. A non-empty buffer means "trailing emit pending".
  const buffer: T[] = [];
  let lastEmit = 0;
  let timer: ReturnType<typeof setTimeout> | undefined = undefined;

  const flush = (): void => {
    const latest = buffer.at(-1);
    buffer.length = 0;
    if (latest === undefined) return; // buffer was empty
    lastEmit = Date.now();
    emit(latest);
  };

  const push = (value: T): void => {
    buffer.push(value);
    const wait = intervalMs - (Date.now() - lastEmit);
    if (wait <= 0) {
      flush(); // leading edge: enough time has passed, emit now
      return;
    }
    // trailing edge: emit the latest value once the interval elapses
    if (timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined;
        flush();
      }, wait);
    }
  };

  const cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    buffer.length = 0;
  };

  return { push, cancel };
};
