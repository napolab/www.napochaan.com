import { NewsNav } from '../news-nav';

import * as s from './styles.css';

import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { ShareBar } from '@components/share-bar';
import { dayjs } from '@utils/dayjs';
import { absoluteUrl } from '@utils/site-url';

import type { Adjacent } from '../../_lib/adjacent-news';
import type { NewsItem } from '../../_lib/news-item';

type Props = {
  item: NewsItem;
  prev?: Adjacent['prev'];
  next?: Adjacent['next'];
};

// Build the breadcrumb trail outside the component scope so the array isn't
// re-created as an inline JSX prop (react-perf/jsx-no-new-array-as-prop).
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { href: '/news', label: 'news' }, { label: title }];

// Shared news detail render — the full page landmark for a single announcement.
// Consumed by both the public ISR page (`/news/{id}`) and the draft-only preview
// page (`/news/preview/{id}`). LivePreviewListener lives on the preview page only,
// never here, so the public page stays free of any draft-mode dependency.
export const NewsDetail = ({ item, prev, next }: Props) => {
  const crumbs = buildCrumbs(item.title);

  // Renders inside the news segment's shared `<main>` (see `news/layout.tsx`), so
  // this contributes content only — no landmark of its own — keeping every detail
  // and preview page to exactly one `<main>` / one `<h1>`.
  return (
    <>
      <PageHeader title={item.title} breadcrumbs={crumbs} kicker={`// ${dayjs(item.date).tz('Asia/Tokyo').format('YYYY.MM.DD')} · ${item.category}`} titleTracking="tight" />
      <div className={s.body}>{item.body === undefined ? null : <RichText data={item.body} />}</div>
      <ShareBar url={absoluteUrl(`/news/${item.id}`)} title={item.title} />
      <NewsNav prev={prev} next={next} />
    </>
  );
};
