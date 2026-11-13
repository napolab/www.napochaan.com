import { withAppProviders } from '@components/app-providers';

import { Breadcrumbs } from './index';

// Island entry for pages placing Breadcrumbs from `.astro` (its client leaves need
// hydration; see components/app-providers).
export const BreadcrumbsIsland = withAppProviders(Breadcrumbs);
