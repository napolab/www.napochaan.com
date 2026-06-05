import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Marquee } from './index';

describe('Marquee', () => {
  it('renders the content duplicated for a seamless loop', async () => {
    await render(<Marquee>napochaan ✕ graphic</Marquee>);
    const items = page.getByText('napochaan ✕ graphic');
    expect(items.all().length).toBe(2);
  });
  it('exposes reverse via data attribute', async () => {
    await render(<Marquee reverse>x</Marquee>);
    await expect.element(page.getByTestId('marquee')).toHaveAttribute('data-reverse', 'true');
  });
});
