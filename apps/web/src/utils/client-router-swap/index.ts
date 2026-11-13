// Whether an Astro <ClientRouter /> soft navigation is mid-swap: true from
// `astro:before-swap` until the new page's `astro:page-load`.
//
// Why imperative leaves care: custom elements in the incoming page connect DURING the
// swap, while the window still holds the previous page's scroll position (the router
// resets scroll afterwards). An in-view trigger bound then judges against that stale
// scroll — a `once` trigger can fire (or be consumed) on the spot for a position the
// visitor never actually scrolled to. Elements defer
// their bind while `isSwapping()` and rebind on the notification at `astro:page-load`.
//
// Module-level state shared by every element (one set of document listeners). Client
// only: imported from bundled element scripts, never from frontmatter.
const state = { swapping: false };
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

const setSwapping = (swapping: boolean) => {
  if (state.swapping === swapping) return;
  state.swapping = swapping;
  notify();
};

document.addEventListener('astro:before-swap', () => setSwapping(true));
document.addEventListener('astro:page-load', () => setSwapping(false));

export const isSwapping = (): boolean => state.swapping;

export const subscribeSwap = (onChange: () => void): (() => void) => {
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
  };
};
