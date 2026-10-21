import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LogoutButton } from './index';

// `@payloadcms/ui` の useTranslation は vitest では key をそのまま返す mock(src/__mocks__/payloadcms-ui.tsx)。
const LOG_OUT_LABEL = 'authentication:logOut';
const ACTION = '/api/users/access-logout';

describe('LogoutButton', () => {
  it('submits a POST form to the Access logout endpoint when an action is given', async () => {
    const screen = await render(<LogoutButton accessLogoutAction={ACTION} />);

    const button = page.getByRole('button', { name: LOG_OUT_LABEL });
    await expect.element(button).toBeVisible();
    await expect.element(button).toHaveAttribute('type', 'submit');
    await expect.element(button).toHaveAttribute('title', LOG_OUT_LABEL);
    await expect.element(button).toHaveClass('nav__log-out');

    const form = screen.container.querySelector('form');
    expect(form?.getAttribute('method')).toBe('post');
    expect(form?.getAttribute('action')).toBe(ACTION);
    expect(form?.contains(button.element())).toBe(true);
  });

  // Payload の admin CSS は素の <button> を reset しないので、UA の枠と背景が出ないことを固定する。
  it('strips the UA button chrome so it looks like the Payload anchor', async () => {
    render(<LogoutButton accessLogoutAction={ACTION} />);

    const button = page.getByRole('button', { name: LOG_OUT_LABEL });
    await expect.element(button).toBeVisible();
    const style = getComputedStyle(button.element());

    expect(style.borderTopStyle).toBe('none');
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(style.paddingTop).toBe('0px');
    expect(style.cursor).toBe('pointer');
  });

  it('renders the Payload logout when the action is null', async () => {
    const screen = await render(<LogoutButton accessLogoutAction={null} />);

    await expect.element(page.getByTestId('payload-logout')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: LOG_OUT_LABEL })).not.toBeInTheDocument();
    expect(screen.container.querySelector('form')).toBeNull();
  });
});
