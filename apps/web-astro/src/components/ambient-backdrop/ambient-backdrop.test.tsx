import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { AmbientBackdrop } from './index';

describe('AmbientBackdrop', () => {
  it('renders an aria-hidden, non-interactive layer', async () => {
    const { container } = await render(<AmbientBackdrop src="/v3-top.png" />);

    const el = container.querySelector('[aria-hidden="true"]');
    expect(el).not.toBeNull();
  });

  it('carries an optimized /_next/image thumbnail url as the --thumb custom property', async () => {
    const { container } = await render(<AmbientBackdrop src="/v3-top.png" />);

    const el = container.querySelector('[aria-hidden="true"]');
    const style = el?.getAttribute('style') ?? '';
    // The decorative wash must not download the full-resolution original — it goes
    // through the worker's /_next/image transformer, downscaled and blurred.
    expect(style).toContain('--thumb: url(/_next/image?');
    expect(style).toContain('url=%2Fv3-top.png');
    expect(style).toContain('w=96');
    expect(style).toContain('blur=40');
  });
});
