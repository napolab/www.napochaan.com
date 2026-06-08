import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { ContactForm } from './index';

vi.mock('../../_actions/submit-contact', () => ({
  submitContact: vi.fn(async () => ({ status: 'success' })),
}));

describe('ContactForm', () => {
  it('renders the name field label', async () => {
    render(<ContactForm />);
    await expect.element(page.getByLabelText('name / お名前')).toBeInTheDocument();
  });

  it('renders the email field label', async () => {
    render(<ContactForm />);
    await expect.element(page.getByLabelText('email / 返信先')).toBeInTheDocument();
  });

  it('renders the message field label', async () => {
    render(<ContactForm />);
    await expect.element(page.getByLabelText('message / 本文')).toBeInTheDocument();
  });

  it('renders a submit control', async () => {
    render(<ContactForm />);
    await expect.element(page.getByRole('button', { name: '送信 →' })).toBeInTheDocument();
  });

  it('renders the email field with type email', async () => {
    render(<ContactForm />);
    await expect.element(page.getByLabelText('email / 返信先')).toHaveAttribute('type', 'email');
  });

  it('shows the success panel after submitting', async () => {
    render(<ContactForm />);
    await page.getByLabelText('name / お名前').fill('napochaan');
    await page.getByLabelText('email / 返信先').fill('napo@example.com');
    await page.getByLabelText('message / 本文').fill('これはテスト用の本文です。');
    await page.getByRole('button', { name: '送信 →' }).click();
    await expect.element(page.getByRole('status')).toBeInTheDocument();
  });
});
