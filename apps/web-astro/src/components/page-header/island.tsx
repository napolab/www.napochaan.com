import { withAppProviders } from '@components/app-providers';

import { PageHeader } from './index';

// Island entry for pages placing PageHeader from `.astro` (its client leaves need
// hydration; see components/app-providers).
export const PageHeaderIsland = withAppProviders(PageHeader);
