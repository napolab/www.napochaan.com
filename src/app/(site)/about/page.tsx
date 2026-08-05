import { Suspense } from 'react';

import { AboutContent } from './_components/about-content';

import { DecodingSkeleton } from '@components/decoding-skeleton';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';
import { findProfile } from '@lib/payload/profile';

import type { Metadata } from 'next';

// Fully static — no time-based revalidate. The profile global's afterChange hook
// busts `/about` on every edit.

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
