import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '../client';

import { splitReleases } from '@lib/software/split-releases';

import { toSoftwareDownload, toSoftwareRelease } from './to-software-download';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type SoftwareRelease = { id: string; version: string; releasedAt: string; changelog?: string; filename: string };
export type SoftwareDownload = {
  id: string;
  name: string;
  summary: string;
  terms: SerializedEditorState;
  latest: SoftwareRelease;
  history: readonly SoftwareRelease[];
};

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

const publishedWhere = { _status: { equals: 'published' } } as const;

// Build one SoftwareDownload from a software doc by querying its releases. Software
// docs with zero releases are skipped by the caller (latest === undefined). Releases
// are read with overrideAccess (admin-only collection) — the public never queries them.
const buildDownload = async (softwareId: string): Promise<SoftwareDownload | undefined> => {
  const payload = await getPayloadClient();
  const software = await payload.findByID({ collection: 'software', id: softwareId, overrideAccess: true });
  const releasesResult = await payload.find({
    collection: 'software-release',
    where: { software: { equals: softwareId } },
    overrideAccess: true,
    limit: 0,
  });
  const releases = releasesResult.docs.map(toSoftwareRelease);
  const split = splitReleases(releases);
  if (split === undefined) return undefined;
  return toSoftwareDownload(software, split.latest, split.history);
};

const fetchDownloadsByIds = unstable_cache(
  async (ids: readonly string[]): Promise<readonly [string, SoftwareDownload][]> => {
    const entries = await Promise.all(ids.map(async (id) => [id, await buildDownload(id)] as const));
    return entries.filter((entry): entry is [string, SoftwareDownload] => entry[1] !== undefined).map(([id, download]) => [id, download]);
  },
  ['software-downloads-by-ids'],
  { tags: [CACHE_TAGS.software] },
);

// Map of software id -> SoftwareDownload, omitting software with zero releases.
export const findSoftwareDownloadsByIds = async (ids: readonly string[]): Promise<ReadonlyMap<string, SoftwareDownload>> => {
  if (isBuildPhase() || ids.length === 0) return new Map();
  return new Map(await fetchDownloadsByIds(ids));
};

const fetchBySlug = unstable_cache(
  async (slug: string): Promise<SoftwareDownload | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({ collection: 'software', where: { and: [{ slug: { equals: slug } }, publishedWhere] }, overrideAccess: true, limit: 1 });
    const [doc] = result.docs;
    if (doc === undefined) return undefined;
    return buildDownload(`${doc.id}`);
  },
  ['software-by-slug'],
  { tags: [CACHE_TAGS.software] },
);

export const findSoftwareBySlug = async (slug: string): Promise<SoftwareDownload | undefined> => {
  if (isBuildPhase()) return undefined;
  return fetchBySlug(slug);
};

// Uncached draft path for the secret-gated live-preview route only.
export const findSoftwareDraftById = async (id: string): Promise<SoftwareDownload | undefined> => {
  if (isBuildPhase()) return undefined;
  const payload = await getPayloadClient();
  const result = await payload.find({ collection: 'software', where: { id: { equals: id } }, draft: true, overrideAccess: true, limit: 1 });
  const [doc] = result.docs;
  if (doc === undefined) return undefined;
  return buildDownload(`${doc.id}`);
};
