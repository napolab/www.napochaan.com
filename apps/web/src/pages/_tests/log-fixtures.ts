import type { ExternalPost } from '../../features/log/lib/external-feeds';
import type { LogManualItem } from '../../features/log/log-manual-item';
import type { WorkRow } from '../../features/works/work-row';

// The three /log sources. The manual gig is far in the future so it stays `upcoming`
// whatever day the suite runs; the past gig has an off-site url.
export const logWorks: readonly WorkRow[] = [
  { id: 'w1', slug: 'vj-tools', no: '01', title: 'VJ tools', type: 'software', year: 2025, date: '2025-03-01' },
  { id: 'w2', slug: 'undated', no: '02', title: 'undated work', type: 'graphic', year: 2024 },
];

export const logPosts: readonly ExternalPost[] = [{ id: 'p1', title: 'zenn article', link: 'https://zenn.dev/napochaan/articles/x', date: '2025-06-10T09:00:00+09:00', source: 'zenn' }];

export const logManual: readonly LogManualItem[] = [
  { id: 'l1', title: 'future gig', date: '2099-07-04', meta: 'gig' },
  { id: 'l2', title: 'past gig', date: '2025-01-10', meta: 'live', url: 'https://example.com/past' },
];
