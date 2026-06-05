import { useState } from 'react';
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { useRafLoop } from './index';

type ConsumerProps = {
  onFrame: () => void;
  fps: number;
  active: boolean;
};

const Consumer = ({ onFrame, fps, active }: ConsumerProps) => {
  useRafLoop(onFrame, { fps, active });
  return null;
};

describe('useRafLoop', () => {
  it('calls onFrame while active is true', async () => {
    const onFrame = vi.fn();
    render(<Consumer onFrame={onFrame} fps={60} active={true} />);

    await expect.poll(() => onFrame.mock.calls.length).toBeGreaterThan(0);
  });

  it('does not call onFrame when active is false', async () => {
    const onFrame = vi.fn();
    render(<Consumer onFrame={onFrame} fps={60} active={false} />);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onFrame).not.toHaveBeenCalled();
  });

  it('stops calling onFrame when active changes from true to false', async () => {
    const onFrame = vi.fn();

    const Wrapper = () => {
      const [active, setActive] = useState(true);
      return (
        <>
          <Consumer onFrame={onFrame} fps={60} active={active} />
          <button onClick={() => setActive(false)}>stop</button>
        </>
      );
    };

    render(<Wrapper />);

    // Wait for loop to start
    await expect.poll(() => onFrame.mock.calls.length).toBeGreaterThan(0);

    // Stop the loop
    await page.getByRole('button', { name: 'stop' }).click();

    // Wait for React state + effect cleanup to propagate
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Snapshot the count and wait another 200ms — it should not grow after cleanup
    const frozenCount = onFrame.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(onFrame.mock.calls.length).toBe(frozenCount);
  });
});
