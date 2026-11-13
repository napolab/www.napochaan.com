import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Profile } from './profile';
import type { MetadataInput } from '@components/seo/build-metadata';

// Port of the Next about `generateMetadata`.
export const resolveAboutMetadata = (profile: Profile | undefined): MetadataInput =>
  resolveSectionMetadata({
    docTitle: 'about',
    description: profile?.tagline ?? undefined,
    path: '/about',
    markdown: '/about.md',
  });
