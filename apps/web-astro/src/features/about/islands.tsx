import { withAppProviders } from '@components/app-providers';

import { AboutMasthead } from './components/about-masthead';

// The masthead's EchoText / TypewriterText need hydration; the rest of the about
// page renders server-only (see src/features/about/about-content.astro).
export const AboutMastheadIsland = withAppProviders(AboutMasthead);
