import { notFound } from 'next/navigation';

import { AboutView } from './_components/about-view';

import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';
import { findProfile } from '@lib/payload/profile';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Static page (no searchParams).
export const revalidate = 3600;

export const generateMetadata = async (): Promise<Metadata> => {
  const profile = await findProfile();

  return resolveSectionMetadata({
    docTitle: 'about',
    description: profile?.tagline ?? undefined,
    path: '/about',
  });
};

const AboutPage = async () => {
  const profile = await findProfile();
  if (profile === undefined) notFound();

  return <AboutView profile={profile} />;
};

export default AboutPage;
