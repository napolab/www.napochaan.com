import { Suspense } from 'react';

import { AboutWhoami } from '../_components/about-whoami';
import { Hero } from '../_components/hero';
import { BlogIndexLoader } from './_sections/blog-index';
import { GallerySectionLoader } from './_sections/gallery-section';
import { LogSectionLoader } from './_sections/log-section';
import { NewsSectionLoader } from './_sections/news-section';
import { WorksSectionLoader } from './_sections/works-section';
import { DecodingSkeleton } from '@components/decoding-skeleton';

import type { Metadata } from 'next';

// Revalidate hourly so OpenNext serves the page via ISR.
export const revalidate = 3600;

const homeDescription = 'DJ・VJ・グラフィック・デジタル制作。napochaan の個人サイト。';

// The OG/Twitter cards are spelled out in full (not just title/description) so the
// child metadata doesn't replace the root layout's card with a partial object: a
// `twitter` without `card` falls back to the small `summary` card, and an
// `openGraph` without `type`/`siteName`/`locale` drops those. The image itself comes
// from the file-convention opengraph-image.png / twitter-image.png under (site).
export const generateMetadata = (): Metadata => ({
  description: homeDescription,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'napochaan',
    locale: 'ja_JP',
    url: '/',
    title: 'napochaan',
    description: homeDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'napochaan',
    description: homeDescription,
  },
});

// Sample data — replaced by Payload CMS in a later plan.
const about = {
  skills: ['TypeScript', 'React', 'Hono', 'Cloudflare', 'WebGPU'],
  now: 'DJ / VJ / グラフィック制作',
  likes: '音楽 · glitch · VRChat · コラージュ · 崩壊(pixelsort・datamosh)',
  wants: '後悔を、残さない。ぼくも、周りも。',
};

const HomePage = () => {
  return (
    <>
      <Hero />
      <AboutWhoami id="about" {...about} />
      <Suspense fallback={<DecodingSkeleton rows={4} fill />}>
        <NewsSectionLoader />
      </Suspense>
      <Suspense fallback={<DecodingSkeleton rows={5} fill />}>
        <WorksSectionLoader />
      </Suspense>
      <Suspense fallback={<DecodingSkeleton rows={5} fill />}>
        <LogSectionLoader />
      </Suspense>
      <Suspense fallback={<DecodingSkeleton rows={6} fill />}>
        <GallerySectionLoader />
      </Suspense>
      <Suspense fallback={<DecodingSkeleton rows={4} fill />}>
        <BlogIndexLoader />
      </Suspense>
    </>
  );
};

export default HomePage;
