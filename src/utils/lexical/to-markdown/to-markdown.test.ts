import { describe, expect, it } from 'vitest';

import { lexicalToMarkdown } from '.';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const BASE = 'https://example.com';
const opts = { baseUrl: BASE };

// Minimal lexical state factory for tests. The runtime walker reads nodes
// structurally (type/children/text/...), so a plain object literal cast once
// here keeps every test case terse.
export const state = (...blocks: readonly unknown[]): SerializedEditorState => ({ root: { children: blocks } }) as unknown as SerializedEditorState;

const text = (value: string, format = 0) => ({ type: 'text', text: value, format });
const paragraph = (...children: readonly unknown[]) => ({ type: 'paragraph', children });
const link = (url: string, ...children: readonly unknown[]) => ({ type: 'link', fields: { url }, children });
const listitem = (...children: readonly unknown[]) => ({ type: 'listitem', children });
const list = (tag: 'ul' | 'ol', ...children: readonly unknown[]) => ({ type: 'list', tag, children });

describe('lexicalToMarkdown: basics', () => {
  it('returns empty string for undefined body', () => {
    expect(lexicalToMarkdown(undefined, opts)).toBe('');
  });

  it('joins paragraphs with blank lines and skips empty ones', () => {
    const body = state(paragraph(text('一段落目')), paragraph(), paragraph(text('二段落目')));
    expect(lexicalToMarkdown(body, opts)).toBe('一段落目\n\n二段落目');
  });

  it('renders headings h1-h6 with # markers', () => {
    const body = state({ type: 'heading', tag: 'h2', children: [text('見出し')] }, { type: 'heading', tag: 'h4', children: [text('小見出し')] });
    expect(lexicalToMarkdown(body, opts)).toBe('## 見出し\n\n#### 小見出し');
  });

  it('applies bold/italic/strikethrough/inline-code format bitmasks', () => {
    // bitmasks mirror src/components/rich-text/converters/text: bold=1 italic=2 strike=4 code=16
    const body = state(paragraph(text('強い', 1), text(' と '), text('code', 16), text(' と '), text('全部', 1 | 2 | 4)));
    expect(lexicalToMarkdown(body, opts)).toBe('**強い** と `code` と **~~*全部*~~**');
  });

  it('renders linebreak as a newline inside a paragraph', () => {
    const body = state(paragraph(text('上'), { type: 'linebreak' }, text('下')));
    expect(lexicalToMarkdown(body, opts)).toBe('上\n下');
  });

  it('ignores unknown node types without throwing', () => {
    const body = state({ type: 'mystery-widget', children: [] }, paragraph(text('生存')));
    expect(lexicalToMarkdown(body, opts)).toBe('生存');
  });
});

describe('lexicalToMarkdown: links', () => {
  it('renders links and absolutizes relative internal URLs', () => {
    const body = state(paragraph(link('/works/miffy', text('miffy')), text(' / '), link('https://zenn.dev/x', text('zenn'))));
    expect(lexicalToMarkdown(body, opts)).toBe('[miffy](https://example.com/works/miffy) / [zenn](https://zenn.dev/x)');
  });

  it('falls back to # for unsafe href schemes', () => {
    const body = state(paragraph(link('javascript:alert(1)', text('evil'))));
    expect(lexicalToMarkdown(body, opts)).toBe('[evil](#)');
  });

  it('renders autolink nodes like link nodes', () => {
    const body = state(paragraph({ type: 'autolink', fields: { url: 'https://example.org' }, children: [text('https://example.org')] }));
    expect(lexicalToMarkdown(body, opts)).toBe('[https://example.org](https://example.org)');
  });
});

describe('lexicalToMarkdown: lists', () => {
  it('renders unordered and ordered lists', () => {
    const body = state(list('ul', listitem(text('a')), listitem(text('b'))), list('ol', listitem(text('one')), listitem(text('two'))));
    expect(lexicalToMarkdown(body, opts)).toBe('- a\n- b\n\n1. one\n2. two');
  });

  it('indents a nested list under its parent item without a stray marker', () => {
    // Lexical wraps a nested list in a listitem whose only child is the list
    // (mirrors the data shape handled by converters/list).
    const body = state(list('ul', listitem(text('parent')), listitem(list('ul', listitem(text('child'))))));
    expect(lexicalToMarkdown(body, opts)).toBe('- parent\n    - child');
  });

  it('renders check-list items with checkbox markers', () => {
    const body = state(list('ul', { type: 'listitem', checked: true, children: [text('done')] }, { type: 'listitem', checked: false, children: [text('todo')] }));
    expect(lexicalToMarkdown(body, opts)).toBe('- [x] done\n- [ ] todo');
  });
});
