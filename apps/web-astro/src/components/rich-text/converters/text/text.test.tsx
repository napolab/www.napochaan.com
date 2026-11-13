import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';

import { textConverter } from './index';

import type { ReactNode } from 'react';

const URL = 'https://naporitan.hatenablog.com/entry/2020/04/10/025705';

// Minimal stand-ins for the Lexical converter args. The `text` converter only
// reads `node.format` / `node.text` and `parent.type`.
type TextNode = { type: 'text'; text: string; format: number };
type ParentNode = { type: string };

const renderText = (node: TextNode, parent?: ParentNode): ReactNode => {
  const converter = textConverter.text;
  if (typeof converter !== 'function') throw new Error('text converter must be a function');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal converter-arg stub
  return converter({ node, parent, childIndex: 0, converters: {}, nodesToJSX: () => [] } as any);
};

describe('textConverter.text', () => {
  it('auto-links a bare URL when the text is not already inside a link', async () => {
    const { container } = await render(<>{renderText({ type: 'text', text: URL, format: 0 })}</>);

    expect(container.querySelectorAll('a')).toHaveLength(1);
  });

  it('does NOT re-link a URL whose parent is an autolink node', async () => {
    // The parent autolink already renders an <a>; re-linkifying here would nest
    // <a> inside <a> and break hydration. The text must render link-free.
    const { container } = await render(<>{renderText({ type: 'text', text: URL, format: 0 }, { type: 'autolink' })}</>);

    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('does NOT re-link a URL whose parent is a link node', async () => {
    const { container } = await render(<>{renderText({ type: 'text', text: URL, format: 0 }, { type: 'link' })}</>);

    expect(container.querySelectorAll('a')).toHaveLength(0);
  });
});
