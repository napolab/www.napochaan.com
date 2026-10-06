import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { authorizeWithAccess } from '../../_actions/authorize';
import { AccessAuthorizeForm } from './index';

const errorMessage = 'Cloudflare Access のセッションが見つかりません。ページを再読み込みしてください。';

// Only the server action is mocked; the initial state is a plain module imported directly.
vi.mock('../../_actions/authorize', () => ({
  authorizeWithAccess: vi.fn(async () => ({ status: 'error', message: errorMessage })),
}));

describe('AccessAuthorizeForm', () => {
  it('shows the Access email and an approve button without credential fields', async () => {
    render(<AccessAuthorizeForm authRequestQuery="client_id=abc" clientName="Claude" email="napo@example.com" />);

    await expect.element(page.getByRole('button', { name: 'napo@example.com として許可する' })).toBeVisible();
    await expect.element(page.getByRole('textbox')).not.toBeInTheDocument();
    await expect.element(page.getByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it('submits the auth request query', async () => {
    render(<AccessAuthorizeForm authRequestQuery="client_id=abc&state=xyz" clientName="Claude" email="napo@example.com" />);

    await page.getByRole('button', { name: 'napo@example.com として許可する' }).click();

    await vi.waitFor(() => expect(authorizeWithAccess).toHaveBeenCalled());
    const [, formData] = vi.mocked(authorizeWithAccess).mock.calls[0] ?? [];
    expect(formData?.get('authRequestQuery')).toBe('client_id=abc&state=xyz');
  });

  it('shows the error message from the action', async () => {
    render(<AccessAuthorizeForm authRequestQuery="client_id=abc" clientName="Claude" email="napo@example.com" />);

    await page.getByRole('button', { name: 'napo@example.com として許可する' }).click();

    await expect.element(page.getByRole('alert')).toHaveTextContent(errorMessage);
  });
});
