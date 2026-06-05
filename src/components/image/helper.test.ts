import { describe, expect, it } from 'vitest';

import { formatBlurURL } from './helper';

describe('formatBlurURL', () => {
  it('should format URL with default options', () => {
    const result = formatBlurURL('/test-image.jpg');
    expect(result).toBe('/_next/image?url=%2Ftest-image.jpg&w=32&q=30');
  });

  it('should format URL with custom width', () => {
    const result = formatBlurURL('/test-image.jpg', { width: 64 });
    expect(result).toBe('/_next/image?url=%2Ftest-image.jpg&w=64&q=30');
  });

  it('should format URL with custom quality', () => {
    const result = formatBlurURL('/test-image.jpg', { quality: 50 });
    expect(result).toBe('/_next/image?url=%2Ftest-image.jpg&w=32&q=50');
  });

  it('should format URL with blur parameter', () => {
    const result = formatBlurURL('/test-image.jpg', { blur: 10 });
    expect(result).toBe('/_next/image?url=%2Ftest-image.jpg&w=32&q=30&blur=10');
  });

  it('should format URL with all custom options', () => {
    const result = formatBlurURL('/test-image.jpg', {
      width: 128,
      quality: 75,
      blur: 5,
    });
    expect(result).toBe('/_next/image?url=%2Ftest-image.jpg&w=128&q=75&blur=5');
  });

  it('should handle blur parameter as 0', () => {
    const result = formatBlurURL('/test-image.jpg', { blur: 0 });
    expect(result).toBe('/_next/image?url=%2Ftest-image.jpg&w=32&q=30&blur=0');
  });

  it('should not include blur parameter when undefined', () => {
    const result = formatBlurURL('/test-image.jpg', {
      width: 64,
      quality: 50,
      blur: undefined,
    });
    expect(result).toBe('/_next/image?url=%2Ftest-image.jpg&w=64&q=50');
  });

  it('should properly encode special characters in path', () => {
    const result = formatBlurURL('/images/test image with spaces.jpg');
    expect(result).toBe('/_next/image?url=%2Fimages%2Ftest+image+with+spaces.jpg&w=32&q=30');
  });

  it('should handle empty string path', () => {
    const result = formatBlurURL('');
    expect(result).toBe('/_next/image?url=&w=32&q=30');
  });

  it('should handle absolute URL path', () => {
    const result = formatBlurURL('https://example.com/image.jpg');
    expect(result).toBe('/_next/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg&w=32&q=30');
  });
});
