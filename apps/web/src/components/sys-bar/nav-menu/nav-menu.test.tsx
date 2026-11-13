import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { parkCursor } from '../../../test-utils/park-cursor';

import { NavMenu } from './index';

// The react-aria menu module is lazy: count its loads and hold it behind a gate, so a
// test can press the trigger BEFORE the chunk arrives (the real-world race).
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

const trigger = () => page.getByRole('button', { name: 'グローバルナビゲーション' });

// Order matters: the lazy chunk resolves once per test file, so the cold-load race
// (press before the chunk lands) runs first.
describe('NavMenu', () => {
  // Offscreen: a resting real cursor must not hover the trigger (which loads the chunk).
  it('renders the trigger without loading the menu chunk', async () => {
    const screen = await render(
      <div style={{ position: 'fixed', top: '-1000px', left: '-1000px' }}>
        <NavMenu pathname="/" />
      </div>,
    );
    await expect.element(trigger()).toBeVisible();
    expect(chunk.loads).toBe(0);
    screen.unmount();
  });

  it('opens on the first Enter pressed before the chunk lands, focusing the first item; Escape returns focus to the trigger', async () => {
    const screen = await render(<NavMenu pathname="/" />);
    trigger().element().focus();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => chunk.loads, LOAD).toBe(1);
    // Still loading: the trigger stays in place and keeps focus.
    expect(page.getByRole('menu').query()).toBeNull();
    await expect.element(trigger()).toHaveFocus();

    chunk.gate.release();
    await expect.element(page.getByRole('menu', { name: 'グローバルナビゲーション' }), LOAD).toBeVisible();
    await expect.element(page.getByRole('menuitem', { name: 'index' }), LOAD).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
    screen.unmount();
  });

  // Swapping the placeholder for react-aria's trigger must not change what AT hears.
  it('exposes the same menu-button semantics before and after the chunk lands', async () => {
    const screen = await render(<NavMenu pathname="/" />);
    const semantics = () => ['aria-haspopup', 'aria-expanded'].map((name) => trigger().element().getAttribute(name));
    expect(semantics()).toEqual(['true', 'false']);
    await userEvent.hover(trigger());
    await userEvent.unhover(trigger());
    await expect.poll(semantics, LOAD).toEqual(['true', 'false']);
    await parkCursor();
    screen.unmount();
  });

  it('keeps a menu that loaded on hover closed until pressed', async () => {
    const screen = await render(<NavMenu pathname="/works" />);
    await userEvent.hover(trigger());
    await expect.element(trigger()).toBeVisible();
    expect(page.getByRole('menu').query()).toBeNull();

    await userEvent.click(trigger());
    await expect.element(page.getByRole('menuitem', { name: 'works' }), LOAD).toHaveAttribute('data-active', 'true');
    await userEvent.keyboard('{Escape}');
    await parkCursor();
    screen.unmount();
  });

  it('keeps focus on the trigger when focus alone loaded the menu', async () => {
    const screen = await render(<NavMenu pathname="/" />);
    trigger().element().focus();
    await expect.element(trigger()).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(page.getByRole('menuitem', { name: 'index' }), LOAD).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    screen.unmount();
  });
});
