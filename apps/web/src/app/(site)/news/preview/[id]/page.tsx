import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { NewsDetail } from '../../_components/news-detail';
import { adjacentNews } from '../../_lib/adjacent-news';

import { LivePreviewListener } from '@components/live-preview';
import { findNewsDraftById, findNewsList } from '@lib/payload/news';

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

  const { id } = await params;
  const item = await findNewsDraftById(id);
  if (item === undefined) return notFound();

  const list = await findNewsList();
  const { prev, next } = adjacentNews(list, item.slug);

  return (
    <>
      <LivePreviewListener />
      <NewsDetail item={item} prev={prev} next={next} />
    </>
  );
};

export default NewsPreviewPage;
