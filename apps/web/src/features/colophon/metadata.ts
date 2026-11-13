import { colophon } from './content';

import type { MetadataInput } from '@components/seo/build-metadata';

// Port of the Next colophon `generateMetadata`.
export const colophonMetadata: MetadataInput = {
  title: colophon.title,
  description: colophon.description,
  alternates: { canonical: '/colophon' },
};
