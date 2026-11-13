import { Badge } from '@components/badge';
import { Card } from '@components/card';
import { DecodingSkeleton } from '@components/decoding-skeleton';
import { FeedLink } from '@components/feed-link';
import { Figure } from '@components/figure';
import { Heading } from '@components/heading';
import { formatBlurURL } from '@components/image/helper';
import { Link } from '@components/link';
import { DescriptionList, List } from '@components/list';
import { Marquee } from '@components/marquee';
import { Pagination } from '@components/pagination';
import { PhrasedText } from '@components/phrased-text';
import { SectionHeading } from '@components/section-heading';
import { SystemAnnotation } from '@components/system-annotation';
import { Table } from '@components/table';
import { Tag } from '@components/tag';
import { Timeline } from '@components/timeline';

import { descItems, figureImage, orderedItems, tableColumns, tableRows, timelineItems, unorderedItems } from './demo-data';
import { TypographyBandDemo } from './typography-band-demo';

import type { StaticDemoName } from './demo-kind';
import type { ReactNode } from 'react';

// Demo-only href builder. (In real use the consumer owns the URL shape;
// Pagination owns layout / a11y / routing.)
const paginationHref = (page: number): string => `?page=${page}`;

// Server-only demos, no directive (see ./demo-kind). A client module rendered here
// (Image in Figure, the react-aria Link) needs no hydration: the image's blur is
// cleared by the inline blur script and links are plain anchors. Link, Pagination and
// FeedLink carry hrefs, so ./demo.astro wraps them in the <NoAction> island.
const staticDemos: Record<StaticDemoName, ReactNode> = {
  Marquee: <Marquee>napochaan ✕ graphic · digital · since 2020 · </Marquee>,
  Heading: (
    <>
      <Heading level={3}>h3 — Subsection</Heading>
      <Heading level={4}>h4 — Group</Heading>
      <Heading level={5}>h5 — Detail</Heading>
      <Heading level={6}>h6 — Minor</Heading>
    </>
  ),
  SectionHeading: (
    <SectionHeading no="01" level={4}>
      works
    </SectionHeading>
  ),
  PhrasedText: <PhrasedText>文章は、読みやすい位置でちゃんと折り返したいんだよなぁ。</PhrasedText>,
  Card: <Card as="div">night vol.13 — 2024.03.15 at Club Eleven</Card>,
  Figure: (
    <Figure
      src={figureImage.src}
      alt="VRChat アバターのフレーミングポーズ"
      width={figureImage.width}
      height={figureImage.height}
      variant="cover"
      caption="frame / 2024"
      placeholder="blur"
      blurDataURL={formatBlurURL(figureImage.src, { blur: 10, width: 32, quality: 30 })}
    />
  ),
  Timeline: <Timeline items={timelineItems} />,
  Table: <Table columns={tableColumns} rows={tableRows} caption="event history 2024" />,
  List: (
    <>
      <List items={unorderedItems} />
      <List ordered items={orderedItems} />
      <DescriptionList items={descItems} />
    </>
  ),
  Badge: (
    <>
      <Badge tone="accent">now playing</Badge>
      <Badge tone="danger">rec</Badge>
      <Badge tone="neutral">offline</Badge>
    </>
  ),
  Tag: (
    <>
      <Tag tone="default">flyer</Tag> <Tag tone="blue">live</Tag> <Tag tone="outline">event</Tag>
    </>
  ),
  SystemAnnotation: (
    <>
      <SystemAnnotation tone="muted">sys.log: ready</SystemAnnotation>
      <SystemAnnotation tone="accent">status: ok</SystemAnnotation>
      <SystemAnnotation tone="danger">err: 404</SystemAnnotation>
    </>
  ),
  Link: (
    <>
      <Link href="/works">作品一覧</Link>{' '}
      <Link href="/about" tone="muted">
        About
      </Link>
    </>
  ),
  Pagination: <Pagination currentPage={3} totalPages={5} href={paginationHref} />,
  FeedLink: <FeedLink href="/news/rss.xml" label="サンプル RSS フィード" />,
  DecodingSkeleton: <DecodingSkeleton rows={4} />,
  TypographyBand: <TypographyBandDemo />,
};

export const StaticDemo = ({ name }: { name: StaticDemoName }) => staticDemos[name];
