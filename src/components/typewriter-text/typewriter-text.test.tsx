import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { TypewriterText } from './index';

describe('TypewriterText', () => {
  it('keeps the full text in the accessible tree', async () => {
    await render(<TypewriterText>napochaan</TypewriterText>);

    // The srOnly copy carries the full text immediately, independent of typing.
    await expect.element(page.getByText('napochaan').first()).toBeInTheDocument();
  });

  it('inserts <wbr> break opportunities when phrase is enabled', async () => {
    const { container } = await render(<TypewriterText phrase>今日は天気です。</TypewriterText>);

    await expect.element(page.getByText('今日は天気です。').first()).toBeInTheDocument();
    // The hidden sizer renders a PhrasedText, so the <wbr> exist from first paint.
    expect(container.querySelector('wbr')).not.toBeNull();
  });
});
