import { withAppProviders } from '@components/app-providers';

import { LivePreviewListener } from './index';

// `LivePreviewListener` is a client leaf ('use client' in apps/web). Placed from the
// draft preview pages; its `router.refresh()` re-fetches the page through ClientRouter.
// Place it with `transition:persist="live-preview"`: RefreshRouteOnSave refreshes once on
// mount, and a refresh is a page swap, so a listener remounted by the swap would refresh
// again in an endless loop. Persisted, it mounts once per preview session.
export const LivePreviewIsland = withAppProviders(LivePreviewListener);
