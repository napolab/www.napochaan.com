import type { Post } from '../../features/blog/post';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const text = (value: string) => ({ type: 'text', text: value, format: 0, style: '', mode: 'normal', detail: 0, version: 1 });
const paragraph = (value: string) => ({ type: 'paragraph', children: [text(value)], format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0 });
const heading = (tag: string, value: string) => ({ type: 'heading', tag, children: [text(value)], format: '', indent: 0, version: 1, direction: 'ltr' });
const codeBlock = (code: string, language: string) => ({ type: 'block', fields: { id: 'c1', blockType: 'Code', code, language }, format: '', version: 2 });

export const detailBody: SerializedEditorState = JSON.parse(
  JSON.stringify({
    root: {
      type: 'root',
      children: [paragraph('lead paragraph'), heading('h2', 'First Section'), codeBlock('const answer = 42;', 'typescript'), heading('h3', 'Sub Section'), paragraph('closing')],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }),
);

const post = (n: number, overrides: Partial<Post> = {}): Post => ({
  id: `${n}`,
  slug: `post-${n}`,
  index: `${n}`.padStart(2, '0'),
  title: `post ${n}`,
  readMin: 3,
  date: `2026-01-${`${n}`.padStart(2, '0')}`,
  excerpt: `excerpt ${n}`,
  ...overrides,
});

// 12 posts → 2 pages of 10. `a.b` (dotted slug) is the newest.
export const blogFeed: readonly Post[] = [
  post(20, { slug: 'a.b', title: 'Dotted Post', body: detailBody, thumbnail: { src: '/api/media/file/thumb.jpg', width: 1280, height: 720 } }),
  ...Array.from({ length: 11 }, (_, i) => post(i + 1)),
];
