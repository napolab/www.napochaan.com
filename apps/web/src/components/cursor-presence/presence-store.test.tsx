import { render } from 'vitest-browser-react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { write } from '@utils/persistent-store';

import { PRESENCE_ENABLED_KEY, publishPresenceCount } from './presence-count';
import { usePresence } from './presence-store';

// The cursor island owns the socket and the SysBar island shows `watching N` and the
// cursors toggle — two separate React roots sharing one module-level presence store.
const Presence = ({ id }: { id: string }) => {
  const { count, enabled, toggle } = usePresence();

  return (
    <button type="button" data-testid={id} onClick={toggle}>
      {`${count}:${enabled ? 'on' : 'off'}`}
    </button>
  );
};

afterEach(() => {
  publishPresenceCount(0);
  write(PRESENCE_ENABLED_KEY, true);
  localStorage.clear();
});

describe('presence store across React roots', () => {
  it('shows a published visitor count in every root', async () => {
    await render(<Presence id="island-a" />);
    await render(<Presence id="island-b" />);

    publishPresenceCount(3);

    await expect.element(page.getByTestId('island-a')).toHaveTextContent('3:on');
    await expect.element(page.getByTestId('island-b')).toHaveTextContent('3:on');
  });

  it('propagates the cursors toggle from one root to the other', async () => {
    await render(<Presence id="island-a" />);
    await render(<Presence id="island-b" />);

    await page.getByTestId('island-a').click();

    await expect.element(page.getByTestId('island-b')).toHaveTextContent('0:off');
  });
});
