import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Video } from './index';

// This is the empirical check behind the SSR comment in `index.tsx`.
// `renderToStaticMarkup` produces the exact HTML string React's server
// renderer emits — the same code path Next.js RSC uses to build the page's
// initial HTML — independent of whatever environment the test itself executes
// in. `render()`/`vitest-browser-react` (used by video.test.tsx) mounts on the
// client only and cannot observe this: it only proves the DOM *property* ends
// up true, not whether the HTML *attribute* was present at parse time.
describe('Video SSR output (ambient variant)', () => {
  it('emits muted, autoplay, loop and playsInline as real HTML attributes', () => {
    const html = renderToStaticMarkup(<Video src="/clip.mp4" variant="ambient" width={640} height={360} />);

    // Confirmed against node_modules/react-dom/cjs/react-dom-server.{node,edge}.production.js
    // `pushAttribute`: muted/autoFocus/multiple are explicitly lowercased; the
    // other boolean media attributes (autoPlay, loop, playsInline) are pushed
    // using their original JSX casing. Browsers case-fold HTML attribute names
    // on parse, so this casing difference has no runtime effect — it is just
    // what the raw markup looks like.
    expect(html).toContain('muted=""');
    expect(html).toContain('autoPlay=""');
    expect(html).toContain('loop=""');
    expect(html).toContain('playsInline=""');
    expect(html).not.toContain('controls');
  });

  it('does not emit muted/autoplay/loop for the player variant', () => {
    const html = renderToStaticMarkup(<Video src="/clip.mp4" variant="player" width={640} height={360} />);

    expect(html).toContain('controls=""');
    expect(html).toContain('preload="metadata"');
    expect(html).not.toContain('muted=""');
    expect(html).not.toContain('autoPlay=""');
    expect(html).not.toContain('loop=""');
  });
});
