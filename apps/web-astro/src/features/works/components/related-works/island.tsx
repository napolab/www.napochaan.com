import { withAppProviders } from '@components/app-providers';

import { RelatedWorks } from './index';

// `RelatedWorks` is a client leaf ('use client' in apps/web): the only kind of component a page
// may hydrate. Placed from `.astro`; see components/app-providers.
export const RelatedWorksIsland = withAppProviders(RelatedWorks);
