import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CursorPresence } from './index';

const addStage = (): HTMLDivElement => {
  const stage = document.createElement('div');
  stage.setAttribute('data-cursor-surface', '');
  document.body.appendChild(stage);
  return stage;
};

afterEach(() => {
  vi.restoreAllMocks();
  for (const el of document.querySelectorAll('[data-cursor-surface]')) el.remove();
});

describe('CursorPresence on the Astro site (surface outside the island)', () => {
  it('re-resolves the stage after every ClientRouter swap, even when the pathname is unchanged', async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const first = addStage();
    await render(<CursorPresence>{null}</CursorPresence>);
    await expect.poll(() => observe.mock.calls.some(([el]) => el === first)).toBe(true);

    // Same-path swap (refresh / query-only navigation): the old stage is replaced.
    first.remove();
    const second = addStage();
    document.dispatchEvent(new Event('astro:after-swap'));

    await expect.poll(() => observe.mock.calls.some(([el]) => el === second)).toBe(true);
  });
});
