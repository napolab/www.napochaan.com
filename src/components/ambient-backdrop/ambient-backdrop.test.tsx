import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { AmbientBackdrop } from './index';

describe('AmbientBackdrop', () => {
  it('renders an aria-hidden, non-interactive layer', async () => {
    const { container } = await render(<AmbientBackdrop src="/v3-top.png" />);

    const el = container.querySelector('[aria-hidden="true"]');
    expect(el).not.toBeNull();
  });

  it('carries the thumbnail url as the --thumb custom property', async () => {
    const { container } = await render(<AmbientBackdrop src="/v3-top.png" />);

    const el = container.querySelector('[aria-hidden="true"]');
    expect(el?.getAttribute('style')).toContain('--thumb: url(/v3-top.png)');
  });
});
