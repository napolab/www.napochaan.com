import { Suspense } from 'react';

import { CalendarSection } from './_components/calendar-section';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { PageHeader } from '@components/page-header';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

// 年表ページ（/log）と同じ 3 ソースを同じ unstable_cache 越しに読むので、
// revalidate も揃えておく — 片方だけ古い月が出るのを避ける。
export const revalidate = 3600;

const calendarDescription = '活動カレンダー — 記録と予定を日付ごとの点で並べた月めくりビュー。';

const crumbs = [{ href: '/', label: 'home' }, { href: '/log', label: 'log' }, { label: 'calendar' }] as const;

export const generateMetadata = (): Metadata =>
  resolveSectionMetadata({
    docTitle: 'calendar',
    description: calendarDescription,
    path: '/log/calendar',
  });

const LogCalendarPage = () => (
  <>
    <PageHeader title="calendar" breadcrumbs={crumbs} kicker="// 活動カレンダー — 記録 · 予定 · 空白" lead="楽しいこと、したいなぁ〜↑" />
    <Suspense fallback={<DecodingSkeleton fill />}>
      <CalendarSection />
    </Suspense>
  </>
);

export default LogCalendarPage;
