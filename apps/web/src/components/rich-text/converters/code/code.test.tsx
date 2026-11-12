import { isValidElement } from 'react';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { codeBlockConverters } from './index';

import type { ReactNode } from 'react';

import type { CodeBlock } from '../types';

// The converter returns an element whose type is an async Server Component
// (./code-block). react-dom's client renderer cannot mount async components,
// so resolve the element manually before rendering — the same technique as
// ./code-block/code-block.test.tsx, but driven through the converter so the
// block-fields → component-props mapping is exercised too.
type AsyncCodeComponent = (props: { code: string; lang?: string }) => Promise<ReactNode>;

const resolveCodeBlock = async (fields: CodeBlock): Promise<ReactNode> => {
  const converter = codeBlockConverters.Code;
  if (typeof converter !== 'function') throw new Error('Code block converter is not registered as a function');

  const node = { type: 'block', format: '', version: 2, fields };
  const element = converter({ node } as never);
  if (!isValidElement(element)) throw new Error('expected the converter to return an element');

  const component = element.type as AsyncCodeComponent;

  return component(element.props as { code: string; lang?: string });
};

describe('codeBlockConverters.Code', () => {
  it('renders highlighted output for a supported language', async () => {
    const { container } = await render(<>{await resolveCodeBlock({ blockType: 'Code', code: 'const x = 1', language: 'typescript' })}</>);

    const pre = container.querySelector('pre');
    expect(pre?.textContent).toBe('const x = 1');
    // Shiki emits inline color styles referencing the project token variables.
    expect(container.innerHTML).toContain('var(--code-');
  });

  it('falls back to plain text for an unknown language', async () => {
    const { container } = await render(<>{await resolveCodeBlock({ blockType: 'Code', code: 'SELECT 1', language: 'sql' })}</>);

    expect(container.querySelector('pre')?.textContent).toBe('SELECT 1');
  });

  it('falls back to plain text when the language is missing', async () => {
    const { container } = await render(<>{await resolveCodeBlock({ blockType: 'Code', code: 'plain source' })}</>);

    expect(container.querySelector('pre')?.textContent).toBe('plain source');
  });

  it('renders an empty block when the code field is missing', async () => {
    const { container } = await render(<>{await resolveCodeBlock({ blockType: 'Code' })}</>);

    expect(container.querySelector('pre')?.textContent).toBe('');
  });
});
