import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { Image } from './index';

describe('Image', () => {
  it('should render with basic props', async () => {
    render(<Image src="/test.jpg" alt="Test image" width={100} height={100} />);

    const image = page.getByTestId('next-image');
    await expect.element(image).toBeInTheDocument();
    await expect.element(image).toHaveAttribute('src', '/test.jpg');
    await expect.element(image).toHaveAttribute('alt', 'Test image');
  });

  it('should handle blur placeholder correctly', async () => {
    render(<Image src="/test.jpg" alt="Test image" width={100} height={100} placeholder="blur" blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD" />);

    const image = page.getByTestId('next-image');
    await expect.element(image).toHaveAttribute('data-placeholder', 'empty');
  });

  it('should handle non-blur placeholder', async () => {
    render(<Image src="/test.jpg" alt="Test image" width={100} height={100} placeholder="empty" />);

    const image = page.getByTestId('next-image');
    await expect.element(image).toHaveAttribute('data-placeholder', 'empty');
  });

  it('should pass through all other props to NextImage', async () => {
    render(<Image src="/test.jpg" alt="Test image" width={100} height={100} quality={90} priority sizes="(max-width: 768px) 100vw, 50vw" />);

    const image = page.getByTestId('next-image');
    await expect.element(image).toHaveAttribute('data-quality', '90');
    await expect.element(image).toHaveAttribute('data-priority', 'true');
    await expect.element(image).toHaveAttribute('data-sizes', '(max-width: 768px) 100vw, 50vw');
  });
});
