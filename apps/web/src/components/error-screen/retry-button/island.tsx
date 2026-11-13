import { withAppProviders } from '@components/app-providers';

import { RetryButton } from './index';

// `RetryButton` is a client leaf: the interactive part of the Next `'use client'`
// error.tsx (a Button whose press handler cannot be passed as island props). Placed
// from `.astro`; see components/app-providers.
export const RetryButtonIsland = withAppProviders(RetryButton);
