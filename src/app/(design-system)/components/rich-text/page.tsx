import { css } from '@styled/css';

import { RichText } from '@components/rich-text';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const sectionStyle = css({ display: 'flex', flexDirection: 'column', gap: 'element', maxWidth: '[800px]' });

const makeText = (text: string, format = 0) => ({
  type: 'text',
  text,
  format,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
});

const raw: unknown = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'heading',
        tag: 'h2',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [makeText('RichText Heading h2')],
      },
      {
        type: 'heading',
        tag: 'h3',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [makeText('Subsection Heading h3')],
      },
      {
        type: 'paragraph',
        textFormat: 0,
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          makeText('Normal text. '),
          makeText('Bold (accent)', 1),
          makeText(', '),
          makeText('italic', 2),
          makeText(', '),
          makeText('strikethrough (danger)', 4),
          makeText(', '),
          makeText('underline', 8),
          makeText(', and '),
          makeText('inline code', 16),
          makeText('.'),
        ],
      },
      {
        type: 'paragraph',
        textFormat: 0,
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'link',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            fields: { linkType: 'custom', url: 'https://napochaan.com', newTab: false },
            children: [makeText('Internal link (same tab)')],
          },
          makeText(' / '),
          {
            type: 'link',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            fields: { linkType: 'custom', url: 'https://example.com', newTab: true },
            children: [makeText('External link (new tab)')],
          },
        ],
      },
      {
        type: 'list',
        tag: 'ul',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        listType: 'bullet',
        start: 1,
        children: [
          { type: 'listitem', format: '', indent: 0, version: 1, direction: 'ltr', value: 1, checked: undefined, children: [makeText('Unordered item one')] },
          { type: 'listitem', format: '', indent: 0, version: 1, direction: 'ltr', value: 2, checked: undefined, children: [makeText('Unordered item two')] },
        ],
      },
      {
        type: 'list',
        tag: 'ol',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        listType: 'number',
        start: 1,
        children: [
          { type: 'listitem', format: '', indent: 0, version: 1, direction: 'ltr', value: 1, checked: undefined, children: [makeText('Ordered item one')] },
          { type: 'listitem', format: '', indent: 0, version: 1, direction: 'ltr', value: 2, checked: undefined, children: [makeText('Ordered item two')] },
        ],
      },
      {
        type: 'quote',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [makeText('TERMINAL-style blockquote. Monospaced, muted, prefixed with "> ".')],
      },
      {
        type: 'horizontalrule',
        type_: 'horizontalrule',
        version: 1,
      },
      {
        type: 'paragraph',
        textFormat: 0,
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [makeText('After the horizontal rule.')],
      },
    ],
  },
};

const sampleData = raw as SerializedEditorState;

const RichTextShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={css({ fontFamily: 'display', fontSize: 'h2' })}>RichText</h1>
      <section className={sectionStyle} aria-label="RichText node showcase">
        <RichText data={sampleData} />
      </section>
    </main>
  );
};

export default RichTextShowcase;
