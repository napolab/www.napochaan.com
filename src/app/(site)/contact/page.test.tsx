import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import ContactPage from './page';

// Isolate the page-structure test from the form's server action / Cloudflare
// context by stubbing the client form.
vi.mock('./_components/contact-form', () => ({
  ContactForm: () => null,
}));

// The page reads the Turnstile site key from the Cloudflare env at render time.
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(async () => ({ env: { TURNSTILE_SITE_KEY: 'test-site-key' } })),
}));

describe('ContactPage', () => {
  it('does not render the page heading or main landmark (owned by the layout)', async () => {
    render(await ContactPage());
    expect(page.getByRole('heading', { level: 1 }).elements()).toHaveLength(0);
    expect(page.getByRole('main').elements()).toHaveLength(0);
  });

  it('renders the message section heading', async () => {
    render(await ContactPage());
    await expect.element(page.getByRole('heading', { name: 'message' })).toBeVisible();
  });

  it('renders the direct section heading', async () => {
    render(await ContactPage());
    await expect.element(page.getByRole('heading', { name: 'direct' })).toBeVisible();
  });

  it('renders the direct-contact links', async () => {
    render(await ContactPage());
    await expect.element(page.getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/naporin0624');
  });
});
