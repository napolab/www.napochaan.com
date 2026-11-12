import { getCloudflareContext } from '@opennextjs/cloudflare';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { NewsDetail } from '../../_components/news-detail';
import { adjacentNews } from '../../_lib/adjacent-news';

import { LivePreviewListener } from '@components/live-preview';
import { findNewsDraftById, findNewsList } from '@lib/cms/news';

// Draft-only Live Preview route. Always dynamic — it must refetch the latest
// draft on every request (autosave streams edits) and is never prerendered or
// cached. Reachable only after the secret-gated handshake at `/next/preview`
// enables draft mode; without it, `isEnabled` is false and we 404 so drafts
// never leak.
export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

const NewsPreviewPage = async ({ params }: Props) => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return notFound();

  // The cms gates drafts on this secret (x-preview-secret). An unset secret
  // could never pass the `/next/preview` handshake either, so treat it as 404.
  const { env } = await getCloudflareContext({ async: true });
  if (env.PREVIEW_SECRET === '') return notFound();

  const { id } = await params;
  const item = await findNewsDraftById(id, env.PREVIEW_SECRET);
  if (item === undefined) return notFound();

  const list = await findNewsList();
  const { prev, next } = adjacentNews(list, item.slug);

  return (
    <>
      <LivePreviewListener serverURL={env.CMS_ORIGIN} />
      <NewsDetail item={item} prev={prev} next={next} />
    </>
  );
};

export default NewsPreviewPage;
