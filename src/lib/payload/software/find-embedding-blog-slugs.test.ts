import { describe, expect, it } from 'vitest';

import { blogSlugsEmbeddingSoftware } from './find-embedding-blog-slugs';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const body = (softwareId: number): SerializedEditorState =>
  ({
    root: { type: 'root', children: [{ type: 'block', fields: { blockType: 'software-download', software: softwareId }, version: 1 }], direction: null, format: '', indent: 0, version: 1 },
  }) as unknown as SerializedEditorState;

describe('blogSlugsEmbeddingSoftware', () => {
  it('returns slugs of posts whose body embeds the software id', () => {
    const posts = [
      { slug: 'a', body: body(5) },
      { slug: 'b', body: body(9) },
      { slug: 'c', body: undefined },
    ];
    expect(blogSlugsEmbeddingSoftware(posts, '5')).toEqual(['a']);
  });
});
