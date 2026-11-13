import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from '@utils/seo/metadata';

// Port of the /log page `generateMetadata`.
export const logMetadata: Metadata = resolveSectionMetadata({
  docTitle: 'log',
  description: '活動年表 — DJ・VJ・リリース・制作物の記録。',
  path: '/log',
  feed: { url: '/log/rss.xml', title: 'napochaan — log' },
  markdown: '/log.md',
});
