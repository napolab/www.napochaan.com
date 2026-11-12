import type { NewsItem } from '../news-item';

// Find a news item by its slug. Returns undefined when no item matches (or the
// list is empty) — the caller decides whether that means a 404.
export const findNews = (items: readonly NewsItem[], slug: string): NewsItem | undefined => items.find((item) => item.slug === slug);
