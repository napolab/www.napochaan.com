// External blog feeds folded into the /log chronicle, each tagged with its source
// so the timeline can render the origin as the entry's meta label.
export const EXTERNAL_FEEDS = [
  { url: 'https://zenn.dev/naporin24690/feed', source: 'zenn' },
  { url: 'https://sizu.me/naporin24690/rss', source: 'sizu' },
  { url: 'https://naporitan.hatenablog.com/rss', source: 'hatena' },
] as const;

// A normalized external post ready to merge into the timeline. `source` carries the
// feed label (`zenn` / `sizu`); `link` is the outbound article URL.
export type ExternalPost = {
  id: string;
  title: string;
  link: string;
  date: string /* ISO */;
  source: string;
};
