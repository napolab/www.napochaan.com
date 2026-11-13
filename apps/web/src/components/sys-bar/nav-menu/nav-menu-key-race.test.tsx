import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { NavMenu } from './index';

// Own file (the lazy chunk resolves once per file): Space is held while the chunk
// lands — keydown reached the placeholder, keyup reaches the real trigger. The press
// must still open the menu, with the first item focused like any keyboard open.
const { chunk } = vi.hoisted(() => {
  const gate: { release: () => void } = { release: () => {} };
  const released = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  return { chunk: { loads: 0, gate, released } };
});
// The gated chunk still has to import react-aria's menu after release — slow under a
// loaded full run, so the waits after `release()` get a generous timeout.
const LOAD = { timeout: 10_000 };

vi.mock('./menu', async (importOriginal) => {
  chunk.loads += 1;
  await chunk.released;
  return importOriginal();
});

const key = (type: string) => new KeyboardEvent(type, { key: ' ', code: 'Space', bubbles: true, cancelable: true, composed: true });

describe('NavMenu (chunk lands mid-keypress)', () => {
  it('opens when the chunk lands between keydown and keyup', async () => {
    const screen = await render(<NavMenu pathname="/" />);
    const trigger = page.getByRole('button', { name: 'グローバルナビゲーション' });
    const placeholder = trigger.element();
    placeholder.focus();
    placeholder.dispatchEvent(key('keydown'));
    await expect.poll(() => chunk.loads, LOAD).toBe(1);

    chunk.gate.release();
    await expect.poll(() => trigger.element() !== placeholder, LOAD).toBe(true);
    trigger.element().dispatchEvent(key('keyup'));

    await expect.element(page.getByRole('menuitem', { name: 'index' }), LOAD).toHaveFocus();
    screen.unmount();
  });
});
