import type { NewsItem } from '../news-item';

// A news item with an explicit external `url` points off-site, so it has no
// internal `/news/{id}` detail page — the surfaces that should reach it (e.g. the
// log timeline) link straight to `url`. The detail route 404s for these items.
export const isExternalNews = (item: NewsItem): boolean => item.url !== undefined;
