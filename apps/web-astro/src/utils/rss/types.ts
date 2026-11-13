// Shared RSS types for both generation (create-rss-document) and parsing
// (parse-feed). Dates are ISO strings; RFC-822 conversion happens only at the
// XML boundary via rfc822-date.

// Channel-level metadata for a generated RSS 2.0 feed.
export type ChannelData = {
  title: string;
  link: string;
  description: string;
  language?: string;
  selfUrl?: string;
  lastBuildDate?: string /* ISO */;
};

// An RSS `<enclosure>` — a media file attached to an item (e.g. a gallery image).
// `length` is the file size in bytes; pass 0 when unknown (RSS allows it).
export type EnclosureData = {
  url: string;
  type: string;
  length: number;
};

// A single generated `<item>`. `link` must already be absolute (caller's
// responsibility). `pubDate`/`lastBuildDate` are ISO and converted to RFC-822.
export type ItemData = {
  title: string;
  link: string;
  guid?: string;
  pubDate?: string /* ISO */;
  category?: string;
  description?: string;
  enclosure?: EnclosureData;
};

// A normalized entry parsed out of an external RSS feed. `date` is ISO in
// Asia/Tokyo; `id` is the guid when present, otherwise the link.
export type FeedItem = {
  id: string;
  title: string;
  link: string;
  date: string /* ISO */;
};
