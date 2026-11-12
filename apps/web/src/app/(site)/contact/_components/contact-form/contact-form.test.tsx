import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { ContactForm } from './index';

vi.mock('../../_actions/submit-contact', () => ({
  submitContact: vi.fn(async () => ({ status: 'success' })),
}));

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

const solveTurnstile = async () => {
  await page.getByRole('button', { name: 'mock-verify' }).click();
};

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

  it('shows the success panel after submitting', async () => {
    render(<ContactForm turnstileSiteKey="test-site-key" />);
    await page.getByLabelText('name / お名前').fill('napochaan');
    await page.getByLabelText('email / 返信先').fill('napo@example.com');
    await page.getByLabelText('message / 本文').fill('これはテスト用の本文です。');
    await solveTurnstile();
    await page.getByRole('button', { name: '送信 →' }).click();
    await expect.element(page.getByRole('status')).toBeInTheDocument();
  });
});
