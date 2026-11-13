import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { actions } from 'astro:actions';

import { ContactForm } from './index';

// Stub the Turnstile widget so tests never load the real Cloudflare script.
// Clicking the stub button solves the challenge by firing onSuccess.
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
    const handleVerify = () => onSuccess('test-token');

    return (
      <button type="button" onClick={handleVerify}>
        mock-verify
      </button>
    );
  },
}));

const submitContact = vi.mocked(actions.submitContact);

const solveTurnstile = async () => {
  await page.getByRole('button', { name: 'mock-verify' }).click();
};

const fillAndSubmit = async () => {
  await page.getByLabelText('name / お名前').fill('napochaan');
  await page.getByLabelText('email / 返信先').fill('napo@example.com');
  await page.getByLabelText('message / 本文').fill('これはテスト用の本文です。');
  await solveTurnstile();
  await page.getByRole('button', { name: '送信 →' }).click();
};

beforeEach(() => {
  submitContact.mockReset().mockResolvedValue({ data: { status: 'success' }, error: undefined });
});

describe('ContactForm', () => {
  it('renders the name field label', async () => {
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await expect.element(page.getByLabelText('name / お名前')).toBeInTheDocument();
  });

  it('renders the email field label', async () => {
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await expect.element(page.getByLabelText('email / 返信先')).toBeInTheDocument();
  });

  it('renders the message field label', async () => {
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await expect.element(page.getByLabelText('message / 本文')).toBeInTheDocument();
  });

  it('renders a submit control', async () => {
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await expect.element(page.getByRole('button', { name: '送信 →' })).toBeInTheDocument();
  });

  it('renders the email field with type email', async () => {
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await expect.element(page.getByLabelText('email / 返信先')).toHaveAttribute('type', 'email');
  });

  it('keeps submit disabled until the Turnstile challenge is solved', async () => {
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await expect.element(page.getByRole('button', { name: '送信 →' })).toBeDisabled();

    await solveTurnstile();
    await expect.element(page.getByRole('button', { name: '送信 →' })).toBeEnabled();
  });

  it('shows the success panel after submitting through the submitContact action', async () => {
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await fillAndSubmit();
    await expect.element(page.getByRole('status')).toHaveTextContent('送信しました。お返事をお待ちください。');
    expect(submitContact).toHaveBeenCalledTimes(1);
    const [formData] = submitContact.mock.calls[0] ?? [];
    expect(formData?.get('name')).toBe('napochaan');
  });

  it('shows the error, field errors and submitted values, and asks for a fresh challenge', async () => {
    submitContact.mockResolvedValue({
      data: {
        status: 'error',
        message: '入力内容を確認してください',
        fieldErrors: { message: ['本文は10文字以上で入力してください'] },
        values: { name: 'napochaan', email: 'napo@example.com', message: '短い' },
      },
      error: undefined,
    });
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await fillAndSubmit();
    await expect.element(page.getByRole('alert').first()).toHaveTextContent('入力内容を確認してください');
    await expect.element(page.getByText('本文は10文字以上で入力してください')).toBeInTheDocument();
    await expect.element(page.getByLabelText('message / 本文')).toHaveValue('短い');
    // The Turnstile widget remounted: the spent token is gone, so submit is disabled again.
    await expect.element(page.getByRole('button', { name: '送信 →' })).toBeDisabled();
  });

  it('shows a generic failure when the action call itself fails', async () => {
    // ActionError's shape (the mocked `astro:actions` has no ActionError class).
    submitContact.mockResolvedValue({ data: undefined, error: Object.assign(new Error('network'), { type: 'AstroActionError', code: 'INTERNAL_SERVER_ERROR' as const, status: 500 }) });
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await fillAndSubmit();
    await expect.element(page.getByRole('alert')).toHaveTextContent('送信に失敗しました。しばらくして再度お試しください。');
    await expect.element(page.getByLabelText('name / お名前')).toHaveValue('napochaan');
  });
});
