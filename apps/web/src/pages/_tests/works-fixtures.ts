import { detailBody } from './blog-fixtures';

import type { WorkRow } from '../../features/works/work-row';

const work = (n: number, overrides: Partial<WorkRow> = {}): WorkRow => ({
  id: `${n}`,
  slug: `work-${n}`,
  no: `${n}`.padStart(2, '0'),
  title: `work ${n}`,
  type: n % 2 === 0 ? 'production' : 'talk',
  year: 2025,
  ...overrides,
});

// 53 works in CMS order → 2 pages of 50. `a.b` (dotted slug, thumbnail + body) is first;
// works 2 and 4 share its `production` type, so they are its related works; work 52 is
// the only `support` work, so it has none.
export const worksFeed: readonly WorkRow[] = [
  work(100, {
    slug: 'a.b',
    title: 'Dotted Work',
    type: 'production',
    year: 2026,
    date: '2026-05-10',
    description: 'a dotted work',
    thumbnail: { src: '/api/media/file/work.jpg', width: 1280, height: 720 },
    body: detailBody,
  }),
  ...Array.from({ length: 51 }, (_, i) => work(i + 1)),
  work(52, { type: 'support' }),
];

export const findWorkFixture = async (slug: string): Promise<WorkRow | undefined> => worksFeed.find((row) => row.slug === slug);
