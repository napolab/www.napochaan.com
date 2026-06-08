import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LeadTypewriter } from './index';

describe('LeadTypewriter', () => {
  it('keeps the full text available for assistive tech', async () => {
    await render(<LeadTypewriter text="ぶらぶら見てってね" />);
    // The srOnly copy carries the complete sentence regardless of typing progress.
    await expect.element(page.getByText('ぶらぶら見てってね')).toBeInTheDocument();
  });
});
