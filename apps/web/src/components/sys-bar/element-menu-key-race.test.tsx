import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { defineSysBarElement } from './element';
import { mountSysBar } from './test-fixture';

// Own file (the chunk resolves once per file): Space is held while the chunk lands —
// keydown reached the static trigger, keyup reaches react-aria's. The press must still
// open the menu, with the first item focused like any keyboard open. Mirrors
// ./nav-menu/nav-menu-key-race.test.tsx.
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

const key = (type: string) => new KeyboardEvent(type, { key: ' ', code: 'Space', bubbles: true, cancelable: true, composed: true });

const mounted: Array<() => void> = [];

// Remove the bar first so its teardown unmounts the menu root (and the popover React
// portaled into <body>) before anything else clears the document.
afterEach(async () => {
  for (const remove of mounted.splice(0)) remove();
  await new Promise((resolve) => setTimeout(resolve, 0));
  document.body.replaceChildren();
});

describe('<sys-bar> mobile menu (chunk lands mid-keypress)', () => {
  it('opens when the chunk lands between keydown and keyup', async () => {
    defineSysBarElement();
    mounted.push(mountSysBar('/').remove);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const trigger = page.getByRole('button', { name: 'グローバルナビゲーション' });
    const placeholder = trigger.element();
    placeholder.focus();
    placeholder.dispatchEvent(key('keydown'));
    await expect.poll(() => chunk.loads, LOAD).toBe(1);

    chunk.gate.release();
    await expect.poll(() => trigger.element() !== placeholder, LOAD).toBe(true);
    trigger.element().dispatchEvent(key('keyup'));

    await expect.element(page.getByRole('menuitem', { name: 'index' }), LOAD).toHaveFocus();
  });
});
