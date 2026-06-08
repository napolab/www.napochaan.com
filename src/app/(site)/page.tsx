import flyerBooth0424 from './_assets/flyer-booth-0424.jpg';
import flyerBooth0523 from './_assets/flyer-booth-0523.jpg';
import vrchatAlice from './_assets/vrchat-alice.jpg';
import vrchatGlitch from './_assets/vrchat-glitch.jpg';
import vrchatSquare from './_assets/vrchat-square.jpg';
import vrchatWide from './_assets/vrchat-wide.jpg';
import { AboutWhoami } from './_components/about-whoami';
import { BlogIndex } from './_components/blog-index';
import { GallerySection } from './_components/gallery-section';
import { LogSection } from './_components/log-section';
import { Hero } from './_components/hero';
import { NewsSection } from './_components/news-section';
import { WorksSection } from './_components/works-section';
import * as s from './styles.css';

import type { GalleryPhoto } from '@components/gallery-archive';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

// Sample data — replaced by Payload CMS in a later plan.
const about = {
  skills: ['TypeScript', 'React', 'Hono', 'Cloudflare', 'WebGPU'],
  now: 'DJ / VJ / グラフィック制作',
  likes: '音楽 · glitch · VRChat · コラージュ · 崩壊(pixelsort・datamosh)',
  wants: '後悔を、残さない。ぼくも、周りも。',
};

const news = [
  { id: '1', date: '2026.06.05', category: 'site', title: 'サイトを rebuild 中。design system を刷新しています', href: '/news/1' },
  { id: '2', date: '2026.06.01', category: 'live', title: '次回 DJ 出演が決定しました', href: '/news/2' },
  { id: '3', date: '2026.05.20', category: 'blog', title: '静かなインターネットの話を書きました', href: '/news/3' },
];

const works = [
  { id: '1', no: '01', title: 'night graphics vol.13', type: 'flyer', year: '2024', thumb: { src: flyerBooth0424.src, width: flyerBooth0424.width, height: flyerBooth0424.height } },
  { id: '2', no: '02', title: 'Booth² key visual', type: 'graphic', year: '2026', thumb: { src: vrchatSquare.src, width: vrchatSquare.width, height: vrchatSquare.height } },
  { id: '3', no: '03', title: 'VRChat stage VJ set', type: 'vj', year: '2025', thumb: { src: vrchatGlitch.src, width: vrchatGlitch.width, height: vrchatGlitch.height } },
];

// Activity chronicle (年表): gigs + releases + works, not just performances.
const activity = [
  { id: '1', date: '06/14', title: 'next gig @ club (予定)', meta: 'Tokyo', upcoming: true },
  { id: '2', date: '05/01', title: 'new EP 公開', meta: 'release' },
  { id: '3', date: '04/02', title: 'techno set @ venue', meta: 'DJ' },
  { id: '4', date: '03/10', title: 'night graphics vol.13', meta: 'flyer' },
  { id: '5', date: '02/18', title: 'VJ @ event', meta: 'VJ' },
];

const gallery: GalleryPhoto[] = [
  { id: '1', src: flyerBooth0424.src, alt: 'Booth² 2026.04.24 イベントフライヤー', width: flyerBooth0424.width, height: flyerBooth0424.height, caption: 'flyer / 04.24' },
  { id: '2', src: vrchatWide.src, alt: 'VRChat ライブ会場の光跡ショット', width: vrchatWide.width, height: vrchatWide.height, caption: 'VRChat' },
  { id: '3', src: vrchatSquare.src, alt: 'VRChat アバターのフレーミングポーズ', width: vrchatSquare.width, height: vrchatSquare.height, caption: 'frame' },
  { id: '4', src: vrchatAlice.src, alt: 'VRChat アバター ALICE ポートレート', width: vrchatAlice.width, height: vrchatAlice.height, caption: 'ALICE' },
  { id: '5', src: flyerBooth0523.src, alt: 'Booth² 2026.05.23 イベントフライヤー', width: flyerBooth0523.width, height: flyerBooth0523.height, caption: 'flyer / 05.23' },
  { id: '6', src: vrchatGlitch.src, alt: 'VRChat アバターのグリッチビジュアル', width: vrchatGlitch.width, height: vrchatGlitch.height, caption: 'glitch' },
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
    <LogSection id="log" entries={activity} />
    <GallerySection id="gallery" items={gallery} />
    <BlogIndex id="blog" posts={posts} />
  </main>
);

export default HomePage;
