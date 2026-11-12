import { describe, expect, it } from 'vitest';

import { fromWorkRowDTO } from './index';

import type { WorkRowDTO } from '@napochaan/cms-api/services';

const base: WorkRowDTO = { id: 'w1', slug: 'w', no: '01', title: 'W', type: 'app', year: 2026 };

describe('fromWorkRowDTO', () => {
  it('parses bodyJSON into a body with a root', () => {
    const work = fromWorkRowDTO({ ...base, bodyJSON: JSON.stringify({ root: { type: 'root', children: [] } }) });
    expect(work.body).toHaveProperty('root');
    expect(work).not.toHaveProperty('bodyJSON');
  });

  it('omits the body and thumbnail keys when absent', () => {
    const work = fromWorkRowDTO(base);
    expect(work).not.toHaveProperty('body');
    expect(work).not.toHaveProperty('thumbnail');
  });

  it('keeps optional fields', () => {
    const full = { ...base, date: '2026-02-03', url: 'https://x', thumbnail: { src: '/a.png', width: 1, height: 2 }, description: 'd', seo: { image: '/i.png' } };
    expect(fromWorkRowDTO(full)).toEqual(full);
  });
});
