import { useCallback } from 'react';
import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { useShare } from './index';

const DATA = { title: 'サンプルタイトル', url: 'https://www.napochaan.com/blog/1' } satisfies ShareData;
const FALLBACK = 'https://www.napochaan.com/blog/1';

const Probe = () => {
  const { copied, share } = useShare(DATA, FALLBACK);
  const handle = useCallback(async () => {
    await share();
  }, [share]);

  return (
    <button type="button" onClick={handle}>
      {copied ? 'copied' : 'share'}
    </button>
  );
};

// Define an own `share` property so the value is honored even when the host Chrome
// exposes a native `navigator.share` on the prototype (macOS). Passing `undefined`
// shadows the native method to simulate an unsupported environment.
const setShare = (impl: ((data: ShareData) => Promise<void>) | undefined): void => {
  Object.defineProperty(navigator, 'share', { value: impl, configurable: true, writable: true });
};

const removeShare = (): void => setShare(undefined);

afterEach(() => {
  vi.restoreAllMocks();
  removeShare();
});

describe('useShare', () => {
  it('invokes the Web Share API with the data and does not copy to the clipboard', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await render(<Probe />);
    await page.getByRole('button', { name: 'share' }).click();

    await vi.waitFor(() => expect(share).toHaveBeenCalledWith(DATA));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to a clipboard copy and flips copied when the Web Share API is unavailable', async () => {
    removeShare();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(<Probe />);
    await page.getByRole('button', { name: 'share' }).click();

    expect(writeText).toHaveBeenCalledWith(FALLBACK);
    await expect.element(page.getByRole('button', { name: 'copied' })).toBeInTheDocument();
  });

  it('swallows the AbortError when the user dismisses the share sheet and does not fall back', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('canceled', 'AbortError'));
    setShare(share);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await render(<Probe />);
    await page.getByRole('button', { name: 'share' }).click();

    await vi.waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to a clipboard copy when the Web Share API fails for a non-abort reason', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('boom', 'NotAllowedError'));
    setShare(share);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);

    await render(<Probe />);
    await page.getByRole('button', { name: 'share' }).click();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(FALLBACK));
  });
});
