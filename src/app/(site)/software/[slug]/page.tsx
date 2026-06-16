import { getCloudflareContext } from '@opennextjs/cloudflare';
import { notFound } from 'next/navigation';

import { SoftwareDetail } from './_components/software-detail';

import { findSoftwareBySlug } from '@lib/payload/software';
import { resolveDetailMetadata } from '@utils/seo/resolve-detail-metadata';

import type { Metadata } from 'next';

export const revalidate = 3600;

type Params = Promise<{ slug: string }>;
type Props = { params: Params };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const software = await findSoftwareBySlug(slug);
  if (software === undefined) return { title: 'software', description: 'ソフトウェア' };
  return resolveDetailMetadata({
    docTitle: software.name,
    path: `/software/${slug}`,
    seo: undefined,
    body: software.terms,
    descriptionCandidates: [software.summary],
    genericDescription: 'ソフトウェア',
    defaultImage: '/og-default.png',
  });
};

const SoftwareDetailPage = async ({ params }: Props) => {
  const { slug } = await params;
  const software = await findSoftwareBySlug(slug);
  if (software === undefined) notFound();
  const { env } = await getCloudflareContext({ async: true });
  return <SoftwareDetail software={software} turnstileSiteKey={env.TURNSTILE_SITE_KEY} />;
};

export default SoftwareDetailPage;
