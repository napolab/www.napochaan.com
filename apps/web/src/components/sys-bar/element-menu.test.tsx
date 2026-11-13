import { navigate } from 'astro:transitions/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { parkCursor } from '../../test-utils/park-cursor';

import { defineSysBarElement } from './element';
import { mountSysBar } from './test-fixture';

// The <sys-bar> element's mobile menu: a static trigger until the first intent, then the
// react-aria menu (./nav-menu/mount — the only module that pulls React in) takes over.
// Count the chunk's loads and hold it behind a gate, so a test can press the trigger
// BEFORE it arrives (the real-world race). Mirrors ./nav-menu/nav-menu.test.tsx.
const { chunk } = vi.hoisted(() => {
  const gate: { release: () => void } = { release: () => {} };
  const released = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  return { chunk: { loads: 0, gate, released } };
});
// The gated chunk still has to import react-dom + react-aria's menu after release —
// slow under a loaded full run, so the waits after `release()` get a generous timeout.
const LOAD = { timeout: 10_000 };

vi.mock('./nav-menu/mount', async (importOriginal) => {
  chunk.loads += 1;
  await chunk.released;
  return importOriginal();
});

const trigger = () => page.getByRole('button', { name: 'グローバルナビゲーション' });
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// Order matters: the chunk resolves once per test file, so the cold-load race (press
// before the chunk lands) runs first.
describe('<sys-bar> mobile menu', () => {
  const initialPath = `${location.pathname}${location.search}`;
  const mounted: Array<() => void> = [];

  beforeEach(() => {
    defineSysBarElement();
  });

  afterEach(async () => {
    for (const remove of mounted.splice(0)) remove();
    await settle();
    history.replaceState(null, '', initialPath);
    vi.mocked(navigate).mockClear();
  });

  const mount = async (pathname = '/', style = '') => {
    const { element, remove } = mountSysBar(pathname, style);
    mounted.push(remove);
    await settle();
    return element;
  };

  // Offscreen: a resting real cursor must not hover the trigger (which loads the chunk).
  it('renders the static trigger without loading React or the menu chunk', async () => {
    await mount('/', 'position: fixed; top: -1000px; left: -1000px;');
    await expect.element(trigger()).toBeInTheDocument();
    expect(chunk.loads).toBe(0);
  });

  it('opens on the first Enter pressed before the chunk lands, focusing the first item; Escape returns focus to the trigger', async () => {
    await mount();
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
  });

  // Swapping the static trigger for react-aria's must not change what AT hears.
  it('exposes the same menu-button semantics before and after the chunk lands', async () => {
    await mount();
    const semantics = () => ['aria-haspopup', 'aria-expanded'].map((name) => trigger().element().getAttribute(name));
    expect(semantics()).toEqual(['true', 'false']);
    await userEvent.hover(trigger());
    await userEvent.unhover(trigger());
    await expect.poll(semantics, LOAD).toEqual(['true', 'false']);
    await parkCursor();
  });

  // Mounted many soft navigations after the server render: the menu reads the path
  // from the location, not from the first page.
  it('keeps a menu that loaded on hover closed until pressed, marking the current section', async () => {
    history.replaceState(null, '', '/works/alpha');
    await mount('/');
    await userEvent.hover(trigger());
    await expect.element(trigger()).toBeVisible();
    expect(page.getByRole('menu').query()).toBeNull();

    await userEvent.click(trigger());
    await expect.element(page.getByRole('menuitem', { name: 'works' }), LOAD).toHaveAttribute('data-active', 'true');
    await userEvent.keyboard('{Escape}');
    await parkCursor();
  });

  it('keeps focus on the trigger when focus alone loaded the menu', async () => {
    await mount();
    trigger().element().focus();
    await expect.element(trigger()).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(page.getByRole('menuitem', { name: 'index' }), LOAD).toHaveFocus();
    await userEvent.keyboard('{Escape}');
  });

  it('soft-navigates a menu item through Astro navigate', async () => {
    await mount();
    trigger().element().focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(page.getByRole('menuitem', { name: 'blog' }), LOAD).toBeVisible();

    await userEvent.click(page.getByRole('menuitem', { name: 'blog' }));
    expect(navigate).toHaveBeenCalledWith('/blog');
    await parkCursor();
  });
});
