import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { useClock } from './index';

const ClockProbe = () => {
  const clock = useClock();
  return <output>{clock}</output>;
};

describe('useClock', () => {
  it('renders a HH:mm:ss-shaped clock string', async () => {
    await render(<ClockProbe />);
    // After mount the interval has not fired yet, so the value is the initial
    // snapshot ('--:--:--') or a real time — both match the HH:mm:ss shape.
    await expect.element(page.getByRole('status')).toHaveTextContent(/^[\d-]{2}:[\d-]{2}:[\d-]{2}$/);
  });
});
