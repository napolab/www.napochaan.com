import { Badge } from '@components/badge';
import { Card } from '@components/card';
import { FeedLink } from '@components/feed-link';
import { Heading } from '@components/heading';
import { DescriptionList, List } from '@components/list';
import { Marquee } from '@components/marquee';
import { PhrasedText } from '@components/phrased-text';
import { RichText } from '@components/rich-text';
import { SectionHeading } from '@components/section-heading';
import { SystemAnnotation } from '@components/system-annotation';
import { Table } from '@components/table';
import { Tag } from '@components/tag';
import { Timeline } from '@components/timeline';

import { descItems, orderedItems, tableColumns, tableRows, timelineItems, unorderedItems } from './demo-data';
import { richTextSample } from './rich-text-sample';
import { TypographyBandDemo } from './typography-band-demo';

import type { StaticDemoName } from './demo-kind';
import type { ReactNode } from 'react';

// Demos that render no client module: server-only React, no directive (see
// ./demo-kind). RichText and FeedLink carry hrefs, so ./demo.astro wraps them in
// the <NoAction> island.
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
  RichText: <RichText data={richTextSample} />,
  PhrasedText: <PhrasedText>文章は、読みやすい位置でちゃんと折り返したいんだよなぁ。</PhrasedText>,
  Card: <Card as="div">night vol.13 — 2024.03.15 at Club Eleven</Card>,
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
  FeedLink: <FeedLink href="/news/rss.xml" label="サンプル RSS フィード" />,
  TypographyBand: <TypographyBandDemo />,
};

export const StaticDemo = ({ name }: { name: StaticDemoName }) => staticDemos[name];
