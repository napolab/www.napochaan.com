import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { useCopy } from './index';

const Probe = ({ text }: { text: string }) => {
  const { copied, copy } = useCopy(text);
  return (
    <button type="button" onClick={copy}>
      {copied ? 'copied' : 'idle'}
    </button>
  );
};

describe('useCopy', () => {
  it('writes the text to the clipboard and flips copied to true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(<Probe text="https://example.com/a" />);
    await page.getByRole('button', { name: 'idle' }).click();

    expect(writeText).toHaveBeenCalledWith('https://example.com/a');
    await expect.element(page.getByRole('button', { name: 'copied' })).toBeInTheDocument();
  });
});
