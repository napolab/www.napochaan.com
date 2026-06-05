import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';

import { useWindowResize } from './index';

type ConsumerProps = {
  onResize: () => void;
};

const Consumer = ({ onResize }: ConsumerProps) => {
  useWindowResize(onResize);
  return null;
};

describe('useWindowResize', () => {
  it('calls onResize once on mount', async () => {
    const onResize = vi.fn();
    render(<Consumer onResize={onResize} />);

    await expect.poll(() => onResize.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(onResize).toHaveBeenCalledOnce();
  });

  it('calls onResize on window resize event', async () => {
    const onResize = vi.fn();
    render(<Consumer onResize={onResize} />);

    // Wait for mount call
    await expect.poll(() => onResize.mock.calls.length).toBeGreaterThanOrEqual(1);

    window.dispatchEvent(new Event('resize'));

    await expect.poll(() => onResize.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
