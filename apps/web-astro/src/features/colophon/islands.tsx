import { withAppProviders } from '@components/app-providers';

import { SourceLink } from './components/source-link';

// The `04 source` link's ScrambleTexts need hydration.
export const SourceLinkIsland = withAppProviders(SourceLink);
