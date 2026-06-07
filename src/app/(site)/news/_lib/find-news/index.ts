import type { NewsItem } from '../news-item';

// Find a news item by its id. Returns undefined when no item matches (or the
// list is empty) — the caller decides whether that means a 404.
export const findNews = (items: readonly NewsItem[], id: string): NewsItem | undefined => items.find((item) => item.id === id);
