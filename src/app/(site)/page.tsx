import flyerBooth0424 from '../(design-system)/_assets/flyer-booth-0424.jpg';
import flyerBooth0523 from '../(design-system)/_assets/flyer-booth-0523.jpg';
import vrchatAlice from '../(design-system)/_assets/vrchat-alice.jpg';
import vrchatGlitch from '../(design-system)/_assets/vrchat-glitch.jpg';
import vrchatSquare from '../(design-system)/_assets/vrchat-square.jpg';
import vrchatWide from '../(design-system)/_assets/vrchat-wide.jpg';
import { AboutWhoami } from './_components/about-whoami';
import { BlogIndex } from './_components/blog-index';
import { GallerySection } from './_components/gallery-section';
import { GigsSection } from './_components/gigs-section';
import { Hero } from './_components/hero';
import { NewsSection } from './_components/news-section';
import { WorksSection } from './_components/works-section';
import * as s from './styles.css';

import type { GalleryItem } from '@components/gallery';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

// Sample data — replaced by Payload CMS in a later plan.
const about = {
  skills: ['TypeScript', 'React', 'Panda CSS', 'Cloudflare'],
  now: 'DJ / VJ / グラフィック制作',
  likes: 'techno · 方眼 · glitch · VRChat',
  wants: '動く背景でインターネットを実験したい',
};

const news = [
  { id: '1', date: '2026.06.05', category: 'site', title: 'サイトを rebuild 中。design system を刷新しています', href: '/news/1' },
  { id: '2', date: '2026.06.01', category: 'live', title: '次回 DJ 出演が決定しました', href: '/news/2' },
  { id: '3', date: '2026.05.20', category: 'blog', title: '静かなインターネットの話を書きました', href: '/news/3' },
];

const works = [
  { id: '1', no: '01', title: 'night graphics vol.13', type: 'flyer', year: '2024' },
  { id: '2', no: '02', title: 'Booth² key visual', type: 'graphic', year: '2026' },
  { id: '3', no: '03', title: 'VRChat stage VJ set', type: 'vj', year: '2025' },
];

const gigs = [
  { id: '1', date: '06/14', event: 'next gig @ club (予定)', venue: 'Tokyo', upcoming: true },
  { id: '2', date: '04/02', event: 'techno set @ venue', venue: 'DJ' },
  { id: '3', date: '02/18', event: 'VJ @ event', venue: 'VJ' },
  { id: '4', date: '2023.11', event: 'DJ @ club night', venue: 'DJ' },
];

const gallery: GalleryItem[] = [
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

const posts = [
  {
    id: '1',
    index: '01',
    title: '静かなインターネットの話',
    source: '静か',
    readMin: 5,
    date: '2026.05.20',
    excerpt: '個人サイトを作り直しながら考える、自分のためのインターネットについて。',
    href: '/blog/1',
  },
  {
    id: '2',
    index: '02',
    title: 'Panda CSS で作る design token',
    source: 'zenn',
    readMin: 8,
    date: '2026.05.10',
    excerpt: 'OKLCH と semantic token で WCAG AA を機械的に担保する話。',
    href: '/blog/2',
  },
];

const HomePage = () => (
  <main id="main-content" className={s.main}>
    <h1 className={s.srOnly}>napochaan — DJ・VJ・グラフィック・デジタル</h1>
    <Hero />
    <AboutWhoami id="about" {...about} />
    <NewsSection items={news} />
    <WorksSection id="works" works={works} />
    <GigsSection id="gigs" gigs={gigs} />
    <GallerySection id="gallery" items={gallery} />
    <BlogIndex id="blog" posts={posts} />
  </main>
);

export default HomePage;
