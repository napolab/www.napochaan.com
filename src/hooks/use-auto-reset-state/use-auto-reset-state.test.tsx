import { useCallback } from 'react';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { useAutoResetState } from './index';

// Uses a string value (not a boolean) to prove the hook is generic over T.
const Probe = ({ resetMs }: { resetMs: number }) => {
  const [label, setLabel] = useAutoResetState('idle', resetMs);
  const handle = useCallback(() => setLabel('busy'), [setLabel]);
  return (
    <button type="button" onClick={handle}>
      {label}
    </button>
  );
};

describe('useAutoResetState', () => {
  it('updates to the new value and auto-resets to the initial after the delay', async () => {
    await render(<Probe resetMs={100} />);
    await page.getByRole('button', { name: 'idle' }).click();

    // Holds the new value immediately…
    await expect.element(page.getByRole('button', { name: 'busy' })).toBeInTheDocument();
    // …then returns to the initial value once the delay elapses (assertion retries).
    await expect.element(page.getByRole('button', { name: 'idle' })).toBeInTheDocument();
  });
});
