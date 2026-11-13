import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it } from 'vitest';

import { TYPOGRAPHY_BAND_TAG, defineTypographyBandElement } from './element';
import { TypographyBand } from './index';

// The band persists across navigations. Its scroll-rest grid snap must not drag the
// page back down after ClientRouter scrolls the swapped-in page to the top. Both the
// React TypographyBand and the <typography-band> element drive ./bind-band.
const spacer = document.createElement('div');

afterEach(() => {
  spacer.remove();
  document.body.replaceChildren();
  scrollTo(0, 0);
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mountReact = async () => {
  await render(<TypographyBand />);
};

const mountElement = async () => {
  defineTypographyBandElement();
  const container = document.createElement('div');
  const band = '<div aria-hidden="true"><div><span>NAPOCHAAN · </span><span>NAPOCHAAN · </span></div></div>';
  container.innerHTML = `<${TYPOGRAPHY_BAND_TAG}>${band.repeat(4)}</${TYPOGRAPHY_BAND_TAG}>`;
  document.body.appendChild(container);
};

describe.each([
  { name: 'TypographyBand (React)', mount: mountReact },
  { name: '<typography-band>', mount: mountElement },
])('$name grid snap across a ClientRouter swap', ({ mount }) => {
  it('cancels an in-flight snap on astro:before-swap so the jump to top sticks', async () => {
    spacer.style.height = '5000px';
    document.body.appendChild(spacer);
    await mount();
    await wait(300); // React effect / element microtask + listeners

    scrollTo({ top: 1013, behavior: 'instant' }); // off the 24px grid → a snap is scheduled
    await wait(200); // SNAP_DELAY (140ms) elapsed: the 0.3s rAF snap tween is now running

    document.dispatchEvent(new Event('astro:before-swap'));
    scrollTo({ top: 0, behavior: 'instant' }); // what the router does after the swap
    await wait(600);

    expect(scrollY).toBe(0);
  });

  it('snaps a real resting scroll onto the 24px grid', async () => {
    spacer.style.height = '5000px';
    document.body.appendChild(spacer);
    await mount();
    await wait(300);

    scrollTo({ top: 1013, behavior: 'instant' });
    await wait(800); // SNAP_DELAY (140ms) + the 0.3s tween, then settled

    expect(scrollY).toBe(1008);
  });
});
