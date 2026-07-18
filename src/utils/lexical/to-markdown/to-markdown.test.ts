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

  it('does not let a nested-list wrapper item consume an ordered number', () => {
    const body = state(list('ol', listitem(text('one')), listitem(list('ul', listitem(text('nested')))), listitem(text('two'))));
    expect(lexicalToMarkdown(body, opts)).toBe('1. one\n    - nested\n2. two');
  });
});

describe('lexicalToMarkdown: quote/code/table/hr', () => {
  it('prefixes quote lines with >', () => {
    const body = state({ type: 'quote', children: [text('一行目'), { type: 'linebreak' }, text('二行目')] });
    expect(lexicalToMarkdown(body, opts)).toBe('> 一行目\n> 二行目');
  });

  // The `Code` block (src/blocks/code) stores the raw source directly in
  // fields.code — newlines/tabs included — so no child-node folding is needed.
  it('renders Code blocks as fenced code with language', () => {
    const body = state({ type: 'block', fields: { blockType: 'Code', language: 'typescript', code: 'const a = 1;\nconst b = 2;' } });
    expect(lexicalToMarkdown(body, opts)).toBe('```typescript\nconst a = 1;\nconst b = 2;\n```');
  });

  it('renders a fence without language when the Code block language is absent', () => {
    const body = state({ type: 'block', fields: { blockType: 'Code', code: 'plain' } });
    expect(lexicalToMarkdown(body, opts)).toBe('```\nplain\n```');
  });

  it('preserves tabs verbatim inside a Code block fence', () => {
    const body = state({ type: 'block', fields: { blockType: 'Code', language: 'typescript', code: 'if (a) {\n\trun();\n}' } });
    expect(lexicalToMarkdown(body, opts)).toBe('```typescript\nif (a) {\n\trun();\n}\n```');
  });

  // コード内容自体が ``` 行を含む場合、外側のフェンスを 1 段長くしないと
  // フェンスが早期終了して以降の本文構造が壊れる(CommonMark の規則)。
  it('widens the fence when the Code block content contains a ``` line', () => {
    const body = state({ type: 'block', fields: { blockType: 'Code', language: 'bash', code: '例:\n```bash\nnpm run build\n```' } });
    expect(lexicalToMarkdown(body, opts)).toBe('````bash\n例:\n```bash\nnpm run build\n```\n````');
  });

  it('renders tables with a separator after the first row', () => {
    const cell = (value: string, headerState = 0) => ({ type: 'tablecell', headerState, children: [paragraph(text(value))] });
    const row = (...cells: readonly unknown[]) => ({ type: 'tablerow', children: cells });
    const body = state({ type: 'table', children: [row(cell('名前', 2), cell('値', 2)), row(cell('a'), cell('b'))] });
    expect(lexicalToMarkdown(body, opts)).toBe('| 名前 | 値 |\n| --- | --- |\n| a | b |');
  });

  it('renders horizontalrule as ---', () => {
    const body = state(paragraph(text('上')), { type: 'horizontalrule' }, paragraph(text('下')));
    expect(lexicalToMarkdown(body, opts)).toBe('上\n\n---\n\n下');
  });
});

describe('lexicalToMarkdown: upload & image-row', () => {
  const media = { url: '/api/media/file/cat.jpg', alt: '猫', mimeType: 'image/jpeg', width: 800, height: 450 };

  it('renders a populated image upload as absolute-URL image with caption line', () => {
    const body = state({ type: 'upload', value: media, fields: { caption: '飼い猫' } });
    expect(lexicalToMarkdown(body, opts)).toBe('![猫](https://example.com/api/media/file/cat.jpg)\n*飼い猫*');
  });

  it('falls back to alt as caption and skips unpopulated uploads', () => {
    const body = state({ type: 'upload', value: media }, { type: 'upload', value: 42 });
    expect(lexicalToMarkdown(body, opts)).toBe('![猫](https://example.com/api/media/file/cat.jpg)\n*猫*');
  });

  it('renders non-image uploads as file links', () => {
    const body = state({ type: 'upload', value: { url: '/api/media/file/tool.zip', mimeType: 'application/zip', filename: 'tool.zip' } });
    expect(lexicalToMarkdown(body, opts)).toBe('[tool.zip](https://example.com/api/media/file/tool.zip)');
  });

  it('renders image-row block cells as stacked images', () => {
    const body = state({
      type: 'block',
      fields: {
        blockType: 'image-row',
        cells: [{ image: media, caption: '左' }, { image: { ...media, url: '/api/media/file/dog.jpg', alt: '犬' } }],
      },
    });
    expect(lexicalToMarkdown(body, opts)).toBe('![猫](https://example.com/api/media/file/cat.jpg)\n*左*\n![犬](https://example.com/api/media/file/dog.jpg)\n*犬*');
  });

  it('skips unknown block types', () => {
    const body = state({ type: 'block', fields: { blockType: 'future-block' } }, paragraph(text('生存')));
    expect(lexicalToMarkdown(body, opts)).toBe('生存');
  });
});
