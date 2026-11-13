import { describe, expect, it } from 'vitest';

import { fromNewsItemDTO } from './index';

import type { NewsItemDTO } from '@napochaan/cms-api/services';

const base: NewsItemDTO = { id: 'n1', slug: 'n', date: '2026-01-01', category: 'c', title: 'N' };

describe('fromNewsItemDTO', () => {
  it('parses bodyJSON into a body with a root', () => {
    const item = fromNewsItemDTO({ ...base, bodyJSON: JSON.stringify({ root: { type: 'root', children: [] } }) });
    expect(item.body).toHaveProperty('root');
    expect(item).not.toHaveProperty('bodyJSON');
  });

  it('omits the body key when bodyJSON is absent', () => {
    expect(fromNewsItemDTO(base)).not.toHaveProperty('body');
  });

  it('keeps scalar fields, url and seo', () => {
    expect(fromNewsItemDTO({ ...base, url: 'https://x', seo: { description: 'd' } })).toEqual({ ...base, url: 'https://x', seo: { description: 'd' } });
  });
});
