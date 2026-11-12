import { describe, expect, it } from 'vitest';

import { fromPostDTO } from './index';

import type { PostDTO } from '@napochaan/cms-api/services';

const base: PostDTO = { id: '1', slug: 'a', index: '01', title: 'T', readMin: 3, date: '2026-01-01', excerpt: 'e' };

describe('fromPostDTO', () => {
  it('parses bodyJSON into a body with a root', () => {
    const post = fromPostDTO({ ...base, bodyJSON: JSON.stringify({ root: { type: 'root', children: [] } }) });
    expect(post.body).toHaveProperty('root');
    expect(post).not.toHaveProperty('bodyJSON');
  });

  it('omits the body key when bodyJSON is absent', () => {
    expect(fromPostDTO(base)).not.toHaveProperty('body');
  });

  it('omits the thumbnail key when the DTO has none', () => {
    expect(fromPostDTO(base)).not.toHaveProperty('thumbnail');
  });

  it('keeps scalar fields, thumbnail and seo', () => {
    const thumbnail = { src: '/a.png', width: 800, height: 600 };
    const seo = { title: 'S' };
    expect(fromPostDTO({ ...base, thumbnail, seo })).toEqual({ ...base, thumbnail, seo });
  });
});
