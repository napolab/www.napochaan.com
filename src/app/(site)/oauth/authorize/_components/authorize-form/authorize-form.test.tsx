import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { AuthorizeForm } from './index';

const errorMessage = 'メールアドレスまたはパスワードが正しくありません。';

vi.mock('../../_actions/authorize', () => ({
  authorize: vi.fn(async () => ({ status: 'error', message: errorMessage })),
  initialAuthorizeState: { status: 'idle' },
}));

describe('AuthorizeForm', () => {
  it('renders email/password fields and the consent button', async () => {
    render(<AuthorizeForm authRequestQuery="client_id=abc" clientName="Claude" />);

    await expect.element(page.getByLabelText(/email/i)).toBeVisible();
    await expect.element(page.getByLabelText(/password/i)).toBeVisible();
    await expect.element(page.getByRole('button', { name: '許可する' })).toBeVisible();
  });

  it('shows the error alert when the action returns an error state', async () => {
    render(<AuthorizeForm authRequestQuery="client_id=abc" clientName="Claude" />);

    await page.getByLabelText(/email/i).fill('napochaan@example.com');
    await page.getByLabelText(/password/i).fill('wrong-password');
    await page.getByRole('button', { name: '許可する' }).click();

    await expect.element(page.getByRole('alert')).toHaveTextContent(errorMessage);
  });
});
