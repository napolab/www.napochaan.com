import { page, userEvent } from 'vitest/browser';

// Moves the real (Playwright) cursor to the bottom-right corner of the viewport and
// leaves it there. Tests that hover / click with userEvent call this at the end, so the
// cursor does not rest over the top-left area where the next test (or file) mounts its
// subject — a resting cursor can fire a trusted pointerenter on a newly mounted node.
export const parkCursor = async (): Promise<void> => {
  const corner = document.createElement('div');
  corner.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 4px; height: 4px;';
  document.body.appendChild(corner);
  await userEvent.hover(page.elementLocator(corner));
  corner.remove();
};
