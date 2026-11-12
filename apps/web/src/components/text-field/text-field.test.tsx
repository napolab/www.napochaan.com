import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { TextField } from './index';

describe('TextField', () => {
  it('renders the label and an associated textbox', async () => {
    render(<TextField label="name / お名前" name="name" />);
    const control = page.getByRole('textbox', { name: 'name / お名前' });
    await expect.element(control).toBeInTheDocument();
    await expect.element(control).toHaveProperty('tagName', 'INPUT');
  });

  it('reflects type="email" on the control', async () => {
    render(<TextField label="email" name="email" type="email" />);
    await expect.element(page.getByRole('textbox', { name: 'email' })).toHaveAttribute('type', 'email');
  });

  it('reflects type="password" on the control', async () => {
    render(<TextField label="password" name="password" type="password" />);
    await expect.element(page.getByLabelText('password')).toHaveAttribute('type', 'password');
  });

  it('reflects isRequired on the control', async () => {
    render(<TextField label="name" name="name" isRequired />);
    await expect.element(page.getByRole('textbox', { name: 'name' })).toHaveProperty('required', true);
  });

  it('renders the description when provided', async () => {
    render(<TextField label="email" name="email" description="返信先のアドレスを入れてね" />);
    await expect.element(page.getByText('返信先のアドレスを入れてね')).toBeInTheDocument();
  });
});
