import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { parkCursor } from '../../test-utils/park-cursor';

import { defineSysBarElement } from './element';
import { mountSysBar } from './test-fixture';

// Own file: the menu chunk resolves once per test file, and this pins the cold-load
// race for a pointer — the click that requests the chunk also opens the menu. Mirrors
// ./nav-menu/nav-menu-pointer.test.tsx for the <sys-bar> element's static trigger.
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

const mounted: Array<() => void> = [];

// Remove the bar first so its teardown unmounts the menu root (and the popover React
// portaled into <body>) before anything else clears the document.
afterEach(async () => {
  for (const remove of mounted.splice(0)) remove();
  await new Promise((resolve) => setTimeout(resolve, 0));
  document.body.replaceChildren();
});

describe('<sys-bar> mobile menu (pointer)', () => {
  it('opens on the first click pressed before the chunk lands', async () => {
    defineSysBarElement();
    mounted.push(mountSysBar('/').remove);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const trigger = page.getByRole('button', { name: 'グローバルナビゲーション' });
    await userEvent.click(trigger);
    await expect.poll(() => chunk.loads, LOAD).toBe(1);
    expect(page.getByRole('menu').query()).toBeNull();

    chunk.gate.release();
    await expect.element(page.getByRole('menu', { name: 'グローバルナビゲーション' }), LOAD).toBeVisible();
    await expect.element(page.getByRole('menuitem', { name: 'gallery' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
    await parkCursor();
  });
});
