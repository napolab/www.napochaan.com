import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { useAutoResetFlag } from './index';

const Probe = ({ resetMs }: { resetMs: number }) => {
  const { active, trigger } = useAutoResetFlag(resetMs);
  return (
    <button type="button" onClick={trigger}>
      {active ? 'on' : 'off'}
    </button>
  );
};

describe('useAutoResetFlag', () => {
  it('turns on when triggered and auto-resets to off after the delay', async () => {
    await render(<Probe resetMs={100} />);
    await page.getByRole('button', { name: 'off' }).click();

    // Flips on immediately…
    await expect.element(page.getByRole('button', { name: 'on' })).toBeInTheDocument();
    // …then resets itself once the delay elapses (assertion retries until then).
    await expect.element(page.getByRole('button', { name: 'off' })).toBeInTheDocument();
  });
});
