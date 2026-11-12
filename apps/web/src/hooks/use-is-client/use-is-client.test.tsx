import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { useIsClient } from './index';

const Consumer = () => {
  const isClient = useIsClient();
  return <div data-testid="value">{`${isClient}`}</div>;
};

describe('useIsClient', () => {
  it('returns true on the client after mount', async () => {
    render(<Consumer />);
    await expect.element(page.getByTestId('value')).toHaveTextContent('true');
  });
});
