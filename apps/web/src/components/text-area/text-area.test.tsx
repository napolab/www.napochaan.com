import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { TextArea } from './index';

describe('TextArea', () => {
  it('renders the label and an associated textarea', async () => {
    render(<TextArea label="message / 本文" name="message" />);
    const control = page.getByRole('textbox', { name: 'message / 本文' });
    await expect.element(control).toBeInTheDocument();
    await expect.element(control).toHaveProperty('tagName', 'TEXTAREA');
  });

  it('honors the rows prop', async () => {
    render(<TextArea label="message" name="message" rows={3} />);
    await expect.element(page.getByRole('textbox', { name: 'message' })).toHaveAttribute('rows', '3');
  });

  it('renders the description when provided', async () => {
    render(<TextArea label="message" name="message" description="本文を入れてね" />);
    await expect.element(page.getByText('本文を入れてね')).toBeInTheDocument();
  });
});
