import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { CodeBlock } from './index';

describe('CodeBlock', () => {
  it('renders highlighted typescript with token color variables', async () => {
    const { container } = await render(<>{await CodeBlock({ code: 'const x = 1', lang: 'typescript' })}</>);

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    // Shiki emits inline color styles referencing our CSS variables.
    expect(container.innerHTML).toContain('var(--code-');
    expect(pre?.textContent).toBe('const x = 1');
  });

  it('falls back to plain text for an unsupported language', async () => {
    const { container } = await render(<>{await CodeBlock({ code: 'SELECT 1', lang: 'sql' })}</>);

    const pre = container.querySelector('pre');
    expect(pre?.textContent).toBe('SELECT 1');
  });

  it('renders plain text when language is undefined', async () => {
    const { container } = await render(<>{await CodeBlock({ code: 'plain', lang: undefined })}</>);

    expect(container.querySelector('pre')?.textContent).toBe('plain');
  });
});
