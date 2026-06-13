import { Suspense } from 'react';

import { Badge } from '@components/badge';
import { Breadcrumbs } from '@components/breadcrumbs';
import { FeedLink } from '@components/feed-link';
import { Button } from '@components/button';
import { Card } from '@components/card';
import { DecodingSkeleton } from '@components/decoding-skeleton';
import { Divider } from '@components/divider';
import { EchoText } from '@components/echo-text';
import { Figure } from '@components/figure';
import { Heading } from '@components/heading';
import { formatBlurURL } from '@components/image/helper';
import { Link } from '@components/link';
import { DescriptionList, List } from '@components/list';
import { Marquee } from '@components/marquee';
import { Pagination } from '@components/pagination';
import { PhrasedText } from '@components/phrased-text';
import { QuoteShare } from '@components/quote-share';
import { RichText } from '@components/rich-text';
import { ScrambleText } from '@components/scramble-text';
import { SectionHeading } from '@components/section-heading';
import { ShareBar } from '@components/share-bar';
import { SystemAnnotation } from '@components/system-annotation';
import { Table } from '@components/table';
import { Tag } from '@components/tag';
import { TextArea } from '@components/text-area';
import { TextField } from '@components/text-field';
import { Timeline } from '@components/timeline';
import { TypewriterText } from '@components/typewriter-text';

import { colophon } from '../content';
import { CursorPresenceDemo } from './cursor-presence-demo';
import { GalleryArchiveLazy } from './gallery-archive-lazy';
import { GalleryLazy } from './gallery-lazy';
import { GameOfLifeDemo } from './game-of-life-demo';
import { LoadingOverlayDemo } from './loading-overlay-demo';
import { NewsRowDemo } from './news-row-demo';
import { NoAction } from './no-action';
import { richTextSample } from './rich-text-sample';
import { TypographyBandDemo } from './typography-band-demo';

import flyerBooth0424 from '@assets/flyer-booth-0424.jpg';
import flyerBooth0523 from '@assets/flyer-booth-0523.jpg';
import vrchatAlice from '@assets/vrchat-alice.jpg';
import vrchatGlitch from '@assets/vrchat-glitch.jpg';
import vrchatSquare from '@assets/vrchat-square.jpg';
import vrchatWide from '@assets/vrchat-wide.jpg';

import type { GalleryItem } from '@components/gallery';
import type { TimelineItem } from '@components/timeline';
import type { ReactNode } from 'react';

// The catalog key set is derived from the content so a name without a demo (or a
// demo without a content entry) is a compile error.
type ComponentName = (typeof colophon.components.items)[number]['name'];

// Demo data only — every demo that carries an href is wrapped in <NoAction>
// (capture-phase preventDefault) so interacting with a showcased component on
// the colophon never navigates. Timeline reads as plain (no clickable title)
// when href is omitted.
const timelineItems: TimelineItem[] = [
  { id: '1', date: '06/14', label: 'night vol.19 @ club eleven', meta: 'Tokyo', upcoming: true },
  { id: '2', date: '05/03', label: 'dawn session @ rooftop', meta: 'DJ set' },
  { id: '3', date: '04/12', label: 'ambient night @ gallery', meta: 'live' },
];

const galleryItems: GalleryItem[] = [
  {
    id: '1',
    src: flyerBooth0424.src,
    alt: 'Booth² 2026.04.24 イベントフライヤー',
    width: flyerBooth0424.width,
    height: flyerBooth0424.height,
    area: 'lead',
    caption: 'flyer / 04.24',
    objectPosition: 'top',
  },
  { id: '2', src: vrchatWide.src, alt: 'VRChat ライブ会場の光跡ショット', width: vrchatWide.width, height: vrchatWide.height, area: 'wide', caption: 'VRChat' },
  { id: '3', src: vrchatSquare.src, alt: 'VRChat アバターのフレーミングポーズ', width: vrchatSquare.width, height: vrchatSquare.height, area: 'square', caption: 'frame' },
  { id: '4', src: vrchatAlice.src, alt: 'VRChat アバター ALICE ポートレート', width: vrchatAlice.width, height: vrchatAlice.height, area: 'inset', caption: 'ALICE', objectPosition: 'top' },
  {
    id: '5',
    src: flyerBooth0523.src,
    alt: 'Booth² 2026.05.23 イベントフライヤー',
    width: flyerBooth0523.width,
    height: flyerBooth0523.height,
    area: 'sub',
    caption: 'flyer / 05.23',
    objectPosition: 'top',
  },
  { id: '6', src: vrchatGlitch.src, alt: 'VRChat アバターのグリッチビジュアル', width: vrchatGlitch.width, height: vrchatGlitch.height, area: 'column', caption: 'glitch', objectPosition: 'center' },
];

const tableColumns = [
  { key: 'no', label: 'no' },
  { key: 'title', label: 'title' },
  { key: 'date', label: 'date' },
  { key: 'venue', label: 'venue' },
];

const tableRows = [
  { no: '01', title: 'night vol.13', date: '2024.03.15', venue: 'club metro' },
  { no: '02', title: 'techno set', date: '2024.04.20', venue: 'circus osaka' },
  { no: '03', title: 'ambient session', date: '2024.05.01', venue: 'forestlimit' },
];

const unorderedItems = ['vinyl selection', 'live PA set', 'ambient drone'];
const orderedItems = ['01. warm-up', '02. peak time', '03. cool-down'];
const descItems = [
  { term: 'role', description: 'DJ / VJ' },
  { term: 'genre', description: 'techno, ambient, noise' },
  { term: 'equipment', description: 'Technics SL-1200, Pioneer DJM-900' },
];

// Realistic hrefs — navigation is neutralized by the <NoAction> wrapper, not by
// dummy URLs, so the markup matches real usage.
const breadcrumbItems = [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: 'night vol.13' }];

// Demo-only href builder. (In real use the consumer owns the URL shape;
// Pagination owns layout / a11y / routing.)
const paginationHref = (page: number): string => `?page=${page}`;

// Live demos keyed by component name, mapped against colophon.components.items in
// the page. Kept out of content.ts so the data file stays JSX-free.
export const demos: Record<ComponentName, ReactNode> = {
  ScrambleText: <ScrambleText>static internet</ScrambleText>,
  EchoText: <EchoText size="compact">napochaan</EchoText>,
  TypewriterText: <TypewriterText>さまざまな「破壊」、承っております。</TypewriterText>,
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
  RichText: (
    <NoAction>
      <RichText data={richTextSample} />
    </NoAction>
  ),
  PhrasedText: <PhrasedText>文章は、読みやすい位置でちゃんと折り返したいんだよなぁ。</PhrasedText>,
  Card: <Card as="div">night vol.13 — 2024.03.15 at Club Eleven</Card>,
  Figure: (
    <Figure
      src={vrchatSquare.src}
      alt="VRChat アバターのフレーミングポーズ"
      width={vrchatSquare.width}
      height={vrchatSquare.height}
      variant="cover"
      caption="frame / 2024"
      placeholder="blur"
      blurDataURL={formatBlurURL(vrchatSquare.src, { blur: 10, width: 32, quality: 30 })}
    />
  ),
  Gallery: (
    <Suspense fallback={<SystemAnnotation tone="muted">loading gallery…</SystemAnnotation>}>
      <GalleryLazy items={galleryItems} />
    </Suspense>
  ),
  GalleryArchive: (
    <Suspense fallback={<SystemAnnotation tone="muted">loading gallery…</SystemAnnotation>}>
      <GalleryArchiveLazy photos={galleryItems} />
    </Suspense>
  ),
  Timeline: <Timeline items={timelineItems} />,
  NewsRow: <NewsRowDemo />,
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
  Button: (
    <>
      <Button variant="solid">solid</Button>
      <Button variant="outline">outline</Button>
      <Button variant="danger">danger</Button>
    </>
  ),
  TextField: <TextField label="name / お名前" name="demo-name" defaultValue="napochaan" autoComplete="off" />,
  TextArea: <TextArea label="message / 本文" name="demo-message" rows={3} defaultValue="はじめまして。" autoComplete="off" />,
  Link: (
    <NoAction>
      <Link href="/works">作品一覧</Link>{' '}
      <Link href="/about" tone="muted">
        About
      </Link>
    </NoAction>
  ),
  Divider: (
    <>
      <Divider />
      <Divider variant="dashed" />
    </>
  ),
  Pagination: (
    <NoAction>
      <Pagination currentPage={3} totalPages={5} href={paginationHref} />
    </NoAction>
  ),
  Breadcrumbs: (
    <NoAction>
      <Breadcrumbs items={breadcrumbItems} />
    </NoAction>
  ),
  FeedLink: (
    <NoAction>
      <FeedLink href="/news/rss.xml" label="サンプル RSS フィード" />
    </NoAction>
  ),
  ShareBar: (
    <NoAction>
      <ShareBar url="https://www.napochaan.com/works/1" title="サンプル作品タイトル" />
    </NoAction>
  ),
  quoteShare: (
    <NoAction>
      <QuoteShare url="https://www.napochaan.com/blog/sample">
        <p>この段落をドラッグで選択すると、選択範囲の上に共有バーが出ます（PC のみ）。</p>
      </QuoteShare>
    </NoAction>
  ),
  DecodingSkeleton: <DecodingSkeleton rows={4} />,
  TypographyBand: <TypographyBandDemo />,
  GameOfLife: <GameOfLifeDemo />,
  CursorPresence: <CursorPresenceDemo />,
  LoadingOverlay: <LoadingOverlayDemo />,
};
