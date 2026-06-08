import { LogTimeline } from './_components/log-timeline';
import { buildLogTimeline } from './_lib/build-log-timeline';
import * as s from './styles.css';

import { news } from '../news/sample-news';
import { works } from '../works/sample-works';

import { PageHeader } from '@components/page-header';
import { dayjs } from '@utils/dayjs';

import type { Metadata } from 'next';

// Revalidate hourly so `upcoming` flips as gigs pass. The chronicle is a single
// continuous page — no pagination — so the whole timeline is statically cached.
export const revalidate = 3600;

const crumbs = [{ href: '/', label: 'home' }, { label: 'log' }];

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return 'log';
    },
    get description() {
      return '活動年表 — DJ・VJ・リリース・制作物の記録。';
    },
  };
};

const LogPage = () => {
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const groups = buildLogTimeline(news, works, now);

  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="log" breadcrumbs={crumbs} kicker="// 活動年表 — gig · release · work" lead="進捗どうですか？" />
      <LogTimeline groups={groups} />
    </main>
  );
};

export default LogPage;
