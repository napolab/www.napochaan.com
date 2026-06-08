import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import ContactPage from './page';

// Isolate the page-structure test from the form's server action / Cloudflare
// context by stubbing the client form.
vi.mock('./_components/contact-form', () => ({
  ContactForm: () => null,
}));

describe('ContactPage', () => {
  it('renders the page heading', async () => {
    render(<ContactPage />);
    await expect.element(page.getByRole('heading', { level: 1, name: 'contact' })).toBeVisible();
  });

  it('renders the message section heading', async () => {
    render(<ContactPage />);
    await expect.element(page.getByRole('heading', { name: 'message' })).toBeVisible();
  });

  it('renders the direct section heading', async () => {
    render(<ContactPage />);
    await expect.element(page.getByRole('heading', { name: 'direct' })).toBeVisible();
  });

  it('renders the direct-contact links', async () => {
    render(<ContactPage />);
    await expect.element(page.getByRole('link', { name: /github/ })).toHaveAttribute('href', 'https://github.com/naporin0624');
  });
});
