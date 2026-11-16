import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import { privacy } from './content';

import type { MetadataInput } from '@components/seo/build-metadata';

export const privacyMetadata: MetadataInput = resolveSectionMetadata({
  docTitle: privacy.title,
  description: privacy.description,
  path: '/privacy',
  markdown: '/privacy.md',
});
