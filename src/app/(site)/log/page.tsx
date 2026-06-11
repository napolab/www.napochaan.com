import { LogTimeline } from './_components/log-timeline';
import { buildLogTimeline } from './_lib/build-log-timeline';
import { fetchExternalPosts } from './_lib/fetch-external-posts';

import { findLogList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// Revalidate hourly so `upcoming` flips as gigs pass. The chronicle is a single
// continuous page — no pagination — so the whole timeline is statically cached.
export const revalidate = 3600;

const logDescription = '活動年表 — DJ・VJ・リリース・制作物の記録。';

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'log',
    description: logDescription,
    path: '/log',
    feed: { url: '/log/rss.xml', title: 'napochaan — log' },
  });

const LogPage = async () => {
  const works = await findWorksList();
  const posts = await fetchExternalPosts();
  const logs = await findLogList();
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const groups = buildLogTimeline(works, posts, now, logs);

  return <LogTimeline groups={groups} />;
};

export default LogPage;
