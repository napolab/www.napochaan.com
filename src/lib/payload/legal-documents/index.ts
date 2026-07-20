import { unstable_cache } from 'next/cache';

import { CACHE_TAGS } from '@utils/cache-tags';

import { getPayloadClient } from '@lib/payload/client';

import type { LegalDocument } from '@payload-types';

// `next build` は Payload に不活性な D1 スタブを渡すため、build 時のクエリは throw する。
// build phase では undefined を返し、実データは ISR + collection の afterChange hook で埋まる。
const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

// Local Payload API は overrideAccess が既定で true なので、公開側クエリは
// `_status: published` を明示的に絞る必要がある。
const publishedWhere = { _status: { equals: 'published' } } as const;

const fetchLegalDocumentBySlug = unstable_cache(
  async (slug: string): Promise<LegalDocument | undefined> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'legal-documents',
      where: { and: [{ slug: { equals: slug } }, publishedWhere] },
      limit: 1,
    });

    const [doc] = result.docs;
    if (doc === undefined) return undefined;

    return doc;
  },
  ['legal-document-by-slug'],
  { tags: [CACHE_TAGS.legalDocuments] },
);

export const findLegalDocumentBySlug = async (slug: string): Promise<LegalDocument | undefined> => {
  if (isBuildPhase()) return undefined;

  return fetchLegalDocumentBySlug(slug);
};

// Draft パスは意図的に uncached(unstable_cache で包まない)で、draft: true により
// _status を問わず最新 draft を返す。secret ゲート済みの preview ルート
// (/legal/preview/{id})からのみ到達するため、公開側に draft が漏れることはない。
export const findLegalDocumentDraftById = async (id: string): Promise<LegalDocument | undefined> => {
  if (isBuildPhase()) return undefined;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'legal-documents',
    where: { id: { equals: id } },
    draft: true,
    overrideAccess: true,
    limit: 1,
  });

  const [doc] = result.docs;
  if (doc === undefined) return undefined;

  return doc;
};
