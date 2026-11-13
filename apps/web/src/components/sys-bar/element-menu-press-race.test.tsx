import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { defineSysBarElement } from './element';
import { mountSysBar } from './test-fixture';

// Own file (the chunk resolves once per file): the chunk lands BETWEEN the press start
// and its release — the static trigger that saw the pointerdown is gone by the
// pointerup, and react-aria's trigger never saw the down. The press must still open.
// Mirrors ./nav-menu/nav-menu-press-race.test.tsx.
const { chunk } = vi.hoisted(() => {
  const gate: { release: () => void } = { release: () => {} };
  const released = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  return { chunk: { loads: 0, gate, released } };
});
const LOAD = { timeout: 10_000 };

vi.mock('./nav-menu/mount', async (importOriginal) => {
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

const mounted: Array<() => void> = [];

// Remove the bar first so its teardown unmounts the menu root (and the popover React
// portaled into <body>) before anything else clears the document.
afterEach(async () => {
  for (const remove of mounted.splice(0)) remove();
  await new Promise((resolve) => setTimeout(resolve, 0));
  document.body.replaceChildren();
});

describe('<sys-bar> mobile menu (chunk lands mid-press)', () => {
  it('opens when the chunk lands between pointerdown and pointerup', async () => {
    defineSysBarElement();
    mounted.push(mountSysBar('/', 'position: fixed; top: -1000px; left: -1000px;').remove);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const trigger = page.getByRole('button', { name: 'グローバルナビゲーション' });
    const placeholder = trigger.element();
    placeholder.dispatchEvent(pointer('pointerdown'));
    await expect.poll(() => chunk.loads, LOAD).toBe(1);

    chunk.gate.release();
    await expect.poll(() => trigger.element() !== placeholder, LOAD).toBe(true);
    trigger.element().dispatchEvent(pointer('pointerup'));

    await expect.element(page.getByRole('menu', { name: 'グローバルナビゲーション' }), LOAD).toBeInTheDocument();
  });
});
