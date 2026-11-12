import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import ContactPage, { dynamic } from './page';

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
  // Regression guard for the "dev-placeholder" incident: a statically prerendered
  // /contact resolves the Cloudflare env on the BUILD machine, where CI seeds
  // .dev.vars from .dev.vars.example (TURNSTILE_SITE_KEY=dev-placeholder). That
  // string got frozen into the cached HTML — which carries no revalidate and is not
  // in bust-isr-cache.mjs — so Turnstile 400'd forever and the submit button stayed
  // disabled. Rendering per request is what keeps the real key reaching the widget.
  it('opts out of static prerendering so the Turnstile site key comes from the runtime env', () => {
    expect(dynamic).toBe('force-dynamic');
  });

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
