import type { MetadataInput } from '@components/seo/build-metadata';

const homeDescription = 'DJ・VJ・グラフィック・デジタル制作。napochaan の個人サイト。';

// Port of the Next home `generateMetadata`. The OG/Twitter cards are spelled out in
// full (not just title/description) so the page's metadata doesn't replace the
// root's card with a partial object: a `twitter` without `card` falls back to the
// small `summary` card, and an `openGraph` without `type`/`siteName`/`locale` drops
// those. No title: the root default (`napochaan`) applies.
export const homeMetadata: MetadataInput = {
  description: homeDescription,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'napochaan',
    locale: 'ja_JP',
    url: '/',
    title: 'napochaan',
    description: homeDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'napochaan',
    description: homeDescription,
  },
};
