import { withAppProviders } from '@components/app-providers';

import { ContactList } from './index';

// Island entry for pages placing ContactList from `.astro` (its client leaves need
// hydration; see components/app-providers).
export const ContactListIsland = withAppProviders(ContactList);
