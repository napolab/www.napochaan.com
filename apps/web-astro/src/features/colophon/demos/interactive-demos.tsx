import { withAppProviders } from '@components/app-providers';
import { BackToIndex } from '@components/back-to-index';
import { Breadcrumbs } from '@components/breadcrumbs';
import { Button } from '@components/button';
import { Calendar } from '@components/calendar';
import { DecodingSkeleton } from '@components/decoding-skeleton';
import { Divider } from '@components/divider';
import { EchoText } from '@components/echo-text';
import { Figure } from '@components/figure';
import { formatBlurURL } from '@components/image/helper';
import { Link } from '@components/link';
import { Pagination } from '@components/pagination';
import { QuoteShare } from '@components/quote-share';
import { ScrambleText } from '@components/scramble-text';
import { ShareBar } from '@components/share-bar';
import { TextArea } from '@components/text-area';
import { TextField } from '@components/text-field';
import { TypewriterText } from '@components/typewriter-text';

import { CursorPresenceDemo } from './cursor-presence-demo';
import { breadcrumbItems, calendarMarks, figureImage } from './demo-data';
import { GameOfLifeDemo } from './game-of-life-demo';
import { LoadingOverlayDemo } from './loading-overlay-demo';
import { NewsRowDemo } from './news-row-demo';
import { NoAction } from './no-action';

import type { InteractiveDemoName } from './demo-kind';
import type { ReactNode } from 'react';

// Demo-only href builder. (In real use the consumer owns the URL shape;
// Pagination owns layout / a11y / routing.) A function cannot cross the island
// props boundary, so it lives on the island side.
const paginationHref = (page: number): string => `?page=${page}`;

// Demos that render a client module, keyed by name. ./demo.astro places one
// `InteractiveDemoIsland` per demo (all share this module's chunk).
const interactiveDemos: Record<InteractiveDemoName, ReactNode> = {
  ScrambleText: <ScrambleText>static internet</ScrambleText>,
  EchoText: <EchoText size="compact">napochaan</EchoText>,
  TypewriterText: <TypewriterText>さまざまな「破壊」、承っております。</TypewriterText>,
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
  NewsRow: <NewsRowDemo />,
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
  Calendar: <Calendar marks={calendarMarks} minDate="2026-06-01" maxDate="2026-07-31" label="活動カレンダー（サンプル）" />,
  ShareBar: (
    <NoAction>
      <ShareBar url="https://www.napochaan.com/works/1" title="サンプル作品タイトル" />
    </NoAction>
  ),
  BackToIndex: (
    <NoAction>
      <BackToIndex href="/blog" label="blog 一覧へもどる" />
    </NoAction>
  ),
  QuoteShare: (
    <NoAction>
      <QuoteShare url="https://www.napochaan.com/blog/sample" title="サンプルブログ記事">
        <p>この段落をドラッグで選択すると、選択範囲の上に共有バーが出ます（PC のみ）。</p>
      </QuoteShare>
    </NoAction>
  ),
  DecodingSkeleton: <DecodingSkeleton rows={4} />,
  GameOfLife: <GameOfLifeDemo />,
  CursorPresence: <CursorPresenceDemo />,
  LoadingOverlay: <LoadingOverlayDemo />,
};

const InteractiveDemo = ({ name }: { name: InteractiveDemoName }) => interactiveDemos[name];

export const InteractiveDemoIsland = withAppProviders(InteractiveDemo);
