import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { parkCursor } from '../../../test-utils/park-cursor';

import { NavMenu } from './index';

// Own file: the lazy chunk resolves once per test file, and this pins the cold-load
// race for a pointer — the click that requests the chunk also opens the menu.
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

describe('NavMenu (pointer)', () => {
  it('opens on the first click pressed before the chunk lands', async () => {
    await render(<NavMenu pathname="/" />);
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
