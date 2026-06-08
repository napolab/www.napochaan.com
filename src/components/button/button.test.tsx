import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { Button } from './index';

describe('Button', () => {
  it('renders its label', async () => {
    render(<Button>送信</Button>);
    await expect.element(page.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });

  it('calls onPress when clicked', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>押す</Button>);
    await page.getByRole('button', { name: '押す' }).click();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('does not call onPress when disabled', async () => {
    const onPress = vi.fn();
    render(
      <Button isDisabled onPress={onPress}>
        無効
      </Button>,
    );
    await page
      .getByRole('button', { name: '無効' })
      .click({ force: true })
      .catch(() => {});
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes the variant via data attribute', async () => {
    render(<Button variant="danger">削除</Button>);
    await expect.element(page.getByRole('button', { name: '削除' })).toHaveAttribute('data-variant', 'danger');
  });

  it('renders a button element when no href is given', async () => {
    render(<Button>label</Button>);
    await expect.element(page.getByRole('button', { name: 'label' })).toBeInTheDocument();
  });

  it('renders an anchor with href when href is given', async () => {
    render(<Button href="/about">enter</Button>);
    const link = page.getByRole('link', { name: 'enter' });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute('href', '/about');
  });

  it('exposes the variant via data attribute on the link form', async () => {
    render(
      <Button href="/x" variant="danger">
        削除
      </Button>,
    );
    await expect.element(page.getByRole('link', { name: '削除' })).toHaveAttribute('data-variant', 'danger');
  });
});
