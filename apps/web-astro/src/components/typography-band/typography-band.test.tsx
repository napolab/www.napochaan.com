import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { TypographyBand } from './index';

describe('TypographyBand', () => {
  it('renders four decorative aria-hidden bands containing the text', async () => {
    await render(<TypographyBand text="NAPOCHAAN · DJ × VJ · " />);
    const bands = page.getByTestId('typography-band');
    expect(bands.all().length).toBe(4);
    await expect.element(bands.first()).toHaveAttribute('aria-hidden', 'true');
  });
});
