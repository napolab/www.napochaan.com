import { afterEach, describe, expect, it, vi } from 'vitest';

import { shareOrCopy } from './index';

const DATA = { title: 'サンプルタイトル', url: 'https://www.napochaan.com/blog/1' } satisfies ShareData;
const FALLBACK = 'https://www.napochaan.com/blog/1';

// An own `share` property shadows any native navigator.share (macOS Chrome);
// `undefined` simulates an unsupported environment.
const setShare = (impl: ((data: ShareData) => Promise<void>) | undefined): void => {
  Object.defineProperty(navigator, 'share', { value: impl, configurable: true, writable: true });
};

afterEach(() => {
  vi.restoreAllMocks();
  setShare(undefined);
});

describe('shareOrCopy', () => {
  it('shares natively and never touches the clipboard', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setShare(share);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    expect(await shareOrCopy(DATA, FALLBACK)).toBe('shared');
    expect(share).toHaveBeenCalledWith(DATA);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('treats a dismissed share sheet (AbortError) as handled', async () => {
    setShare(vi.fn().mockRejectedValue(new DOMException('canceled', 'AbortError')));
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    expect(await shareOrCopy(DATA, FALLBACK)).toBe('shared');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies the fallback when the Web Share API is unavailable', async () => {
    setShare(undefined);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    expect(await shareOrCopy(DATA, FALLBACK)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(FALLBACK);
  });

  it('copies the fallback when native sharing fails for a real reason', async () => {
    setShare(vi.fn().mockRejectedValue(new DOMException('boom', 'NotAllowedError')));
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    expect(await shareOrCopy(DATA, FALLBACK)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(FALLBACK);
  });
});
