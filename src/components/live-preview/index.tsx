'use client';

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

// Mounted inside Payload's Live Preview iframe on the news detail page. It
// listens for the admin's save events (posted from the CMS origin) and refreshes
// the route so the preview reflects unsaved/draft edits in real time. Outside the
// iframe this is inert. The CMS shares the site origin, so the expected message
// origin is the current window's origin (resolved client-side; this component is
// never server-rendered with a value).
export const LivePreviewListener = () => {
  const router = useRouter();
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);
  const serverURL = useMemo(() => (typeof window === 'undefined' ? '' : window.location.origin), []);

  return <RefreshRouteOnSave refresh={refresh} serverURL={serverURL} />;
};
