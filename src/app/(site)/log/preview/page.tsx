import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { LogTimeline } from '../_components/log-timeline';
import { buildLogTimeline } from '../_lib/build-log-timeline';
import { fetchExternalPosts } from '../_lib/fetch-external-posts';

import { LivePreviewListener } from '@components/live-preview';
import { findLogDraftList } from '@lib/payload/logs';
import { findWorksList } from '@lib/payload/works';
import { dayjs } from '@utils/dayjs';

// Draft-only Live Preview route. Always dynamic — it must refetch the latest
// drafts on every request (autosave streams edits) and is never prerendered or
// cached. Reachable only after the secret-gated handshake at `/next/preview`
// enables draft mode; without it, `isEnabled` is false and we 404 so drafts
// never leak. The log is an aggregate timeline: only the `logs` collection is
// read as draft; works/external posts stay published since they aren't the
// document being edited.
export const dynamic = 'force-dynamic';

const LogPreviewPage = async () => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return notFound();

  const works = await findWorksList();
  const posts = await fetchExternalPosts();
  const logs = await findLogDraftList();
  const now = dayjs().tz('Asia/Tokyo').toISOString();
  const groups = buildLogTimeline(works, posts, now, logs);

  return (
    <>
      <LivePreviewListener />
      <LogTimeline groups={groups} />
    </>
  );
};

export default LogPreviewPage;
