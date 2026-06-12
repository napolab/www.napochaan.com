export type OgSection = 'works' | 'news' | 'blog';

// Uppercased section chip label (WORKS / NEWS / BLOG). Pure.
export const sectionLabel = (section: OgSection): string => section.toUpperCase();
