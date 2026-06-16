/**
 * Cache tags for on-demand revalidation. Data queries tag their `unstable_cache`
 * reads with these; collection hooks bust the same tag on publish/delete.
 * Values match the Payload collection slugs they invalidate.
 */
export const CACHE_TAGS = {
  news: 'news',
  works: 'works',
  blog: 'blog',
  gallery: 'gallery',
  logs: 'logs',
  profile: 'profile',
  software: 'software',
} as const;
