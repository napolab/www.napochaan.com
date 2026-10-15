import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LogoutButton } from './index';

describe('LogoutButton', () => {
  it('links to the Access logout when accessLogout is true', async () => {
    render(<LogoutButton accessLogout />);

    const link = page.getByRole('link', { name: 'ログアウト' });
    await expect.element(link).toBeVisible();
    await expect.element(link).toHaveAttribute('href', '/cdn-cgi/access/logout');
  });

  it('renders the Payload logout when accessLogout is false', async () => {
    render(<LogoutButton accessLogout={false} />);

    await expect.element(page.getByTestId('payload-logout')).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'ログアウト' })).not.toBeInTheDocument();
  });
});
