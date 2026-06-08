import { notFound } from 'next/navigation';

import { AboutView } from './_components/about-view';

import { findProfile } from '@lib/payload/profile';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Static page (no searchParams).
export const revalidate = 3600;

export const generateMetadata = async (): Promise<Metadata> => {
  const profile = await findProfile();

  return {
    get title() {
      return 'about';
    },
    get description() {
      return profile?.tagline;
    },
  };
};

const AboutPage = async () => {
  const profile = await findProfile();
  if (profile === undefined) notFound();

  return <AboutView profile={profile} />;
};

export default AboutPage;
