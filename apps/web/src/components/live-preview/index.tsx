'use client';

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react';
import { useRouter } from '@lib/navigation';
import { useCallback } from 'react';

type Props = {
  // cms Worker origin (env.CMS_ORIGIN, read on the server by the preview page).
  // The admin posts save events from there, and RefreshRouteOnSave only accepts
  // messages whose origin matches exactly — so no trailing slash.
  serverURL?: string;
};

// Mounted inside the cms admin's Live Preview iframe on the draft preview pages.
// It listens for the admin's save events and refreshes the route so the preview
// reflects draft edits in real time. Outside the iframe this is inert. Without a
// configured cms origin there is nothing to listen to, so it renders nothing.
export const LivePreviewListener = ({ serverURL }: Props) => {
  const router = useRouter();
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  if (serverURL === undefined) return null;

  return <RefreshRouteOnSave refresh={refresh} serverURL={serverURL} />;
};
