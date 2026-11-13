import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { NavMenu } from './index';

// Own file (the lazy chunk resolves once per file): the chunk lands BETWEEN the press
// start and its release — the placeholder that saw the pointerdown is gone by the
// pointerup, and the real trigger never saw the down. The press must still open.
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

// A real (non-virtual) mouse pointer: react-aria treats 1×1 / pressure 0 / detail 0 as
// a virtual (screen reader) click.
const pointer = (type: string) =>
  new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerdown' ? 1 : 0,
    width: 1,
    height: 1,
    pressure: 0.5,
    detail: 1,
  });

describe('NavMenu (chunk lands mid-press)', () => {
  it('opens when the chunk lands between pointerdown and pointerup', async () => {
    const screen = await render(<NavMenu pathname="/" />);
    const trigger = page.getByRole('button', { name: 'グローバルナビゲーション' });
    const placeholder = trigger.element();
    placeholder.dispatchEvent(pointer('pointerdown'));
    await expect.poll(() => chunk.loads, LOAD).toBe(1);

    chunk.gate.release();
    await expect.poll(() => trigger.element() !== placeholder, LOAD).toBe(true);
    trigger.element().dispatchEvent(pointer('pointerup'));

    await expect.element(page.getByRole('menu', { name: 'グローバルナビゲーション' }), LOAD).toBeVisible();
    screen.unmount();
  });
});
