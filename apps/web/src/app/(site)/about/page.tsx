import { Suspense } from 'react';

import { AboutContent } from './_components/about-content';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';
import { findProfile } from '@lib/cms/profile';

import type { Metadata } from 'next';

// SSR on every Workers Cache miss; the worker stamps the purge-driven `cms` policy
// (.claude/rules/workers-cache.md) and a CMS publish purges it.
export const dynamic = 'force-dynamic';

export const generateMetadata = async (): Promise<Metadata> => {
  const profile = await findProfile();

  return resolveSectionMetadata({
    docTitle: 'about',
    description: profile?.tagline ?? undefined,
    path: '/about',
    markdown: '/about.md',
  });
};

const AboutPage = () => {
  return (
    <Suspense fallback={<DecodingSkeleton rows={8} fill />}>
      <AboutContent />
    </Suspense>
  );
};

export default AboutPage;
