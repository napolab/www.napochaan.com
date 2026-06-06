import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { CursorPresence } from './index';
import { usePresence } from './presence-context';

const Probe = () => {
  const { enabled, toggle } = usePresence();

  return (
    <button type="button" onClick={toggle}>
      state:{enabled ? 'on' : 'off'}
    </button>
  );
};

describe('CursorPresence', () => {
  it('provides presence context and toggles enabled state', async () => {
    localStorage.removeItem('cursor-presence-enabled');
    render(
      <CursorPresence>
        <div data-cursor-surface style={{ width: 400, height: 800 }} />
        <Probe />
      </CursorPresence>,
    );
    const btn = page.getByText(/state:/);
    await expect.element(btn).toHaveTextContent('state:on');
    await btn.click();
    await expect.element(btn).toHaveTextContent('state:off');
  });
});
