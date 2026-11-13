import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it } from 'vitest';

import { TypographyBand } from './index';

// The band lives in a persisted island. Its scroll-rest grid snap must not drag the
// page back down after ClientRouter scrolls the swapped-in page to the top.
const spacer = document.createElement('div');

afterEach(() => {
  spacer.remove();
  scrollTo(0, 0);
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('TypographyBand grid snap across a ClientRouter swap', () => {
  it('cancels an in-flight snap on astro:before-swap so the jump to top sticks', async () => {
    spacer.style.height = '5000px';
    document.body.appendChild(spacer);
    await render(<TypographyBand />);
    await wait(300); // gsap chunk + listeners

    scrollTo({ top: 1013, behavior: 'instant' }); // off the 24px grid → a snap is scheduled
    await wait(200); // SNAP_DELAY (140ms) elapsed: the 0.3s snap tween is now running

    document.dispatchEvent(new Event('astro:before-swap'));
    scrollTo({ top: 0, behavior: 'instant' }); // what the router does after the swap
    await wait(600);

    expect(scrollY).toBe(0);
  });
});
