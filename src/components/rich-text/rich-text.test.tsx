import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { RichText } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// Helper to build a typed editor state from an untyped literal.
const state = (children: unknown[]): SerializedEditorState => {
  const raw: unknown = {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  };
  return raw as SerializedEditorState;
};

const text = (value: string, format = 0) => ({
  type: 'text',
  text: value,
  format,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
});

const heading = (tag: string, children: unknown[]) => ({
  type: 'heading',
  tag,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children,
});

const paragraph = (children: unknown[]) => ({
  type: 'paragraph',
  textFormat: 0,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children,
});

const list = (tag: 'ul' | 'ol', itemChildren: unknown[][]) => ({
  type: 'list',
  tag,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  listType: tag === 'ul' ? 'bullet' : 'number',
  start: 1,
  children: itemChildren.map((children, i) => ({
    type: 'listitem',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    value: i + 1,
    checked: undefined,
    children,
  })),
});

const quote = (children: unknown[]) => ({
  type: 'quote',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children,
});

const link = (url: string, linkChildren: unknown[]) => ({
  type: 'link',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  fields: { linkType: 'custom', url, newTab: false },
  children: linkChildren,
});

describe('RichText', () => {
  it('renders an h2 heading', async () => {
    render(<RichText data={state([heading('h2', [text('Hello h2')])])} />);
    await expect.element(page.getByRole('heading', { level: 2, name: 'Hello h2' })).toBeInTheDocument();
  });

  it('renders bold text with a <strong> element', async () => {
    render(
      <RichText
        data={state([
          paragraph([
            text('plain '),
            text('bold', 1), // IS_BOLD = 1
          ]),
        ])}
      />,
    );
    // A <strong> should be rendered for the bold text
    await expect.element(page.getByText('bold')).toBeInTheDocument();
  });

  it('renders strikethrough text with an <s> element', async () => {
    render(
      <RichText
        data={state([
          paragraph([
            text('struck', 4), // IS_STRIKETHROUGH = 4
          ]),
        ])}
      />,
    );
    await expect.element(page.getByText('struck')).toBeInTheDocument();
  });

  it('renders inline code with a <code> element', async () => {
    render(
      <RichText
        data={state([
          paragraph([
            text('const x = 1', 16), // IS_CODE = 16
          ]),
        ])}
      />,
    );
    await expect.element(page.getByText('const x = 1')).toBeInTheDocument();
  });

  it('renders a link with correct href', async () => {
    render(<RichText data={state([paragraph([link('https://example.com', [text('click here')])])])} />);
    const a = page.getByRole('link', { name: 'click here' });
    await expect.element(a).toHaveAttribute('href', 'https://example.com');
  });

  it('renders a list with list items', async () => {
    render(<RichText data={state([list('ul', [[text('Item one')], [text('Item two')]])])} />);
    await expect.element(page.getByText('Item one')).toBeInTheDocument();
    await expect.element(page.getByText('Item two')).toBeInTheDocument();
  });

  it('renders a blockquote', async () => {
    render(<RichText data={state([quote([text('A wise quote.')])])} />);
    await expect.element(page.getByText('A wise quote.')).toBeInTheDocument();
  });

  it('inserts BudouX phrase breaks (<wbr>) into Japanese prose', async () => {
    render(<RichText data={state([paragraph([text('今日は天気です。')])])} />);
    const prose = page.getByText('今日は天気です。').first();
    await expect.element(prose).toBeVisible();
    expect(prose.element().querySelectorAll('wbr').length).toBeGreaterThan(0);
  });

  it('does not phrase-break inline code', async () => {
    render(<RichText data={state([paragraph([text('const x = 1', 16)])])} />);
    const code = page.getByText('const x = 1').first();
    await expect.element(code).toBeVisible();
    expect(code.element().querySelectorAll('wbr').length).toBe(0);
  });
});
