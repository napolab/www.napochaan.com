import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { MetadataInput } from '@components/seo/build-metadata';

// Port of the Next contact `generateMetadata`.
export const contactMetadata: MetadataInput = resolveSectionMetadata({
  docTitle: 'contact',
  description: 'お問い合わせ — フォーム、または各種 SNS から直接どうぞ。',
  path: '/contact',
});
