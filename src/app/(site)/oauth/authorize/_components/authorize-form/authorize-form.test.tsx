import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { AuthorizeForm } from './index';

describe('AuthorizeForm', () => {
  it('renders email/password fields and the consent button', async () => {
    render(<AuthorizeForm authRequestQuery="client_id=abc" clientName="Claude" />);

    await expect.element(page.getByLabelText(/email/i)).toBeVisible();
    await expect.element(page.getByLabelText(/password/i)).toBeVisible();
    await expect.element(page.getByRole('button', { name: '許可する' })).toBeVisible();
  });
});
