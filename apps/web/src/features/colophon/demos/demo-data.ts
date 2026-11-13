import flyerBooth0424 from '@assets/flyer-booth-0424.jpg';
import flyerBooth0523 from '@assets/flyer-booth-0523.jpg';
import vrchatAlice from '@assets/vrchat-alice.jpg';
import vrchatGlitch from '@assets/vrchat-glitch.jpg';
import vrchatSquare from '@assets/vrchat-square.jpg';
import vrchatWide from '@assets/vrchat-wide.jpg';

import type { CalendarMark } from '@components/calendar';
import type { GalleryItem } from '@components/gallery';
import type { TimelineItem } from '@components/timeline';

// Demo data only — every demo that carries an href is wrapped in <NoAction>
// (capture-phase preventDefault) so interacting with a showcased component on
// the colophon never navigates. Timeline reads as plain (no clickable title)
// when href is omitted.
export const timelineItems: TimelineItem[] = [
  { id: '1', date: '06/14', label: 'night vol.19 @ club eleven', meta: 'Tokyo', upcoming: true },
  { id: '2', date: '05/03', label: 'dawn session @ rooftop', meta: 'DJ set' },
  { id: '3', date: '04/12', label: 'ambient night @ gallery', meta: 'live' },
];

export const galleryItems: GalleryItem[] = [
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

// The Figure demo's image (same file as gallery item 3).
export const figureImage = { src: vrchatSquare.src, width: vrchatSquare.width, height: vrchatSquare.height };

export const tableColumns = [
  { key: 'no', label: 'no' },
  { key: 'title', label: 'title' },
  { key: 'date', label: 'date' },
  { key: 'venue', label: 'venue' },
];

export const tableRows = [
  { no: '01', title: 'night vol.13', date: '2024.03.15', venue: 'club metro' },
  { no: '02', title: 'techno set', date: '2024.04.20', venue: 'circus osaka' },
  { no: '03', title: 'ambient session', date: '2024.05.01', venue: 'forestlimit' },
];

export const unorderedItems = ['vinyl selection', 'live PA set', 'ambient drone'];
export const orderedItems = ['01. warm-up', '02. peak time', '03. cool-down'];
export const descItems = [
  { term: 'role', description: 'DJ / VJ' },
  { term: 'genre', description: 'techno, ambient, noise' },
  { term: 'equipment', description: 'Technics SL-1200, Pioneer DJM-900' },
];

// Realistic hrefs — navigation is neutralized by the <NoAction> wrapper, not by
// dummy URLs, so the markup matches real usage.
export const breadcrumbItems = [{ href: '/', label: 'home' }, { href: '/works', label: 'works' }, { label: 'night vol.13' }];

// default ドットと accent ドットが両方見えるサンプル。実行日に依らず表示が
// 固定されるよう min/max で 2026-06〜07 に範囲を絞ってある。
export const calendarMarks = [{ date: '2026-06-06' }, { date: '2026-06-20' }, { date: '2026-07-11', tone: 'accent' }, { date: '2026-07-25', tone: 'accent' }] satisfies CalendarMark[];
