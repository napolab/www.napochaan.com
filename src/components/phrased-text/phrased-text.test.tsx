import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { PhrasedText } from './index';

describe('PhrasedText', () => {
  it('renders the full text content', async () => {
    render(<PhrasedText>今日は天気です。</PhrasedText>);
    await expect.element(page.getByText('今日は天気です。')).toBeVisible();
  });

  it('inserts <wbr> break opportunities between phrases', async () => {
    render(<PhrasedText>今日は天気です。</PhrasedText>);
    const text = page.getByText('今日は天気です。');
    await expect.element(text).toBeVisible();
    expect(text.element().querySelectorAll('wbr').length).toBeGreaterThan(0);
  });
});
