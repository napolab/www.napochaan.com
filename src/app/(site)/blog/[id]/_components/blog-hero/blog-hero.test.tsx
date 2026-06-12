import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { BlogHero } from './index';

const thumbnail = { src: '/v3-top.png', width: 1280, height: 720 };

describe('BlogHero', () => {
  it('renders the thumbnail with the title as alt text', async () => {
    const { container } = await render(<BlogHero thumbnail={thumbnail} title="v3.0.0 の制作について" caption="2026.06.10" />);

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('v3.0.0 の制作について');
  });

  it('renders the caption tag', async () => {
    const { container } = await render(<BlogHero thumbnail={thumbnail} title="t" caption="2026.06.10" />);

    expect(container.textContent).toContain('2026.06.10');
  });

  it('paints an aria-hidden ambient backdrop', async () => {
    const { container } = await render(<BlogHero thumbnail={thumbnail} title="t" caption="2026.06.10" />);

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
