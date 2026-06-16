import { getCloudflareContext } from '@opennextjs/cloudflare';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { SoftwareDetail } from '../../[slug]/_components/software-detail';

import { LivePreviewListener } from '@components/live-preview';
import { findSoftwareDraftById } from '@lib/payload/software';

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

const SoftwarePreviewPage = async ({ params }: Props) => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return notFound();

  const { id } = await params;
  const software = await findSoftwareDraftById(id);
  if (software === undefined) return notFound();

  const { env } = await getCloudflareContext({ async: true });

  return (
    <>
      <LivePreviewListener />
      <SoftwareDetail software={software} turnstileSiteKey={env.TURNSTILE_SITE_KEY} />
    </>
  );
};

export default SoftwarePreviewPage;
