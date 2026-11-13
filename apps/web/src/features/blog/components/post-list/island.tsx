import { withAppProviders } from '@components/app-providers';

import { PostCard } from './post-card';

// `PostCard` is a client leaf ('use client' in apps/web): the only kind of component
// a page may hydrate. Placed from ./post-list.astro; see components/app-providers.
export const PostCardIsland = withAppProviders(PostCard);
