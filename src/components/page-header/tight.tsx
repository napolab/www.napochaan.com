// Dedicated entry point for PageHeader's "tight" tracking variant (the long,
// mostly-Japanese detail titles on works / news / blog). This file — not
// index.tsx — owns the import of the Zen Kaku Gothic New font module
// (@themes/fonts-title). next/font emits that face's 122 unicode-range
// @font-face rules (~30 KB CSS) into every route whose module graph imports the
// module that declares the loader call, so keeping that import scoped to this
// component means only routes that actually render TightPageHeader (works/[slug],
// blog/[slug], the news detail component, and their /preview counterparts) pull
// the font's CSS into their bundle — home and every index page never import this
// file and never pay for it.
//
// PageHeader (./index.tsx) no longer accepts `titleTracking="tight"` at the type
// level, so this is also the only way to render the tight variant at all — the
// font and the variant can never be separated by accident.
import { titleFontVariable } from '@themes/fonts-title';

import { PageHeaderBase } from './base';

import type { PageHeaderBaseProps } from './base';

type Props = Omit<PageHeaderBaseProps, 'titleTracking' | 'titleClassName'>;

export const TightPageHeader = (props: Props) => {
  return <PageHeaderBase {...props} titleTracking="tight" titleClassName={titleFontVariable} />;
};
