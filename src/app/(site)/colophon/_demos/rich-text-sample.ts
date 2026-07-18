import vrchatGlitch from '@assets/vrchat-glitch.jpg';
import vrchatSquare from '@assets/vrchat-square.jpg';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

// A lexical document exercising every node the RichText renderer supports —
// headings, inline formats, links, lists, blockquote, a fenced code block, a
// horizontal rule, a single image upload, and the custom image-row block. Used
// only by the colophon RichText demo.
const makeText = (text: string, format = 0) => ({
  type: 'text',
  text,
  format,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
});

// A premade `Code` lexical block node (src/blocks/code, blockType 'Code') —
// the raw source lives directly in fields.code and RichText's code block
// converter re-highlights it with Shiki server-side.
const makeCode = (language: string, code: string) => ({
  type: 'block',
  format: '',
  version: 2,
  fields: { id: 'demo-code', blockType: 'Code', language, code },
});

const skylineSnippet = `// pick the leftmost column whose covered shelf is lowest
const bestStart = (heights, span) => {
  const candidates = Array.from({ length: heights.length - span + 1 }, (_, start) => ({
    start,
    y: Math.max(...heights.slice(start, start + span)),
  }));

  return candidates.reduce((best, c) => (c.y < best.y ? c : best));
};`;

// A populated-media image-row cell shaped like Payload returns it (url/width/
// height/alt), built from a static demo asset.
const makeCell = (asset: { src: string; width: number; height: number }, alt: string, caption: string) => ({
  image: { url: asset.src, alt, width: asset.width, height: asset.height, filename: alt, mimeType: 'image/jpeg' },
  caption,
});

// A `youtube-embed` lexical block node (src/blocks/youtube-embed, blockType
// 'youtube-embed'). The converter parses the videoID at render time and drops
// a privacy-enhanced (youtube-nocookie) 16:9 iframe with the caption as its
// figcaption + iframe title.
const makeYouTube = (url: string, caption: string) => ({
  type: 'block',
  format: '',
  version: 2,
  fields: { id: 'demo-youtube', blockType: 'youtube-embed', url, caption },
});

// A single image upload node shaped like Payload returns it, exercising the
// standalone in-body figure (intrinsic when small, capped to 85% when large).
const makeUpload = (asset: { src: string; width: number; height: number }, alt: string, caption: string) => ({
  type: 'upload',
  version: 3,
  format: '',
  id: 'demo-upload',
  fields: { caption },
  relationTo: 'media',
  value: { url: asset.src, alt, width: asset.width, height: asset.height, filename: alt, mimeType: 'image/jpeg' },
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
      makeCode('typescript', skylineSnippet),
      makeYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'YouTube embed / demo'),
      makeUpload(vrchatGlitch, 'VRChat アバター glitch', 'single / 2024'),
      {
        type: 'block',
        format: '',
        version: 2,
        fields: {
          id: 'demo-image-row',
          blockType: 'image-row',
          cells: [makeCell(vrchatSquare, 'VRChat アバター square', 'left / 2024'), makeCell(vrchatGlitch, 'VRChat アバター glitch', 'right / 2024')],
        },
      },
      {
        type: 'horizontalrule',
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

export const richTextSample = raw as SerializedEditorState;
