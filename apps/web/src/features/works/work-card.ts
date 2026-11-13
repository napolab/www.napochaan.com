import type { WorkRow } from './work-row';

// The fields the works lists (WorksArchive, RelatedWorks, AdjacentNav) render. Kept
// narrow so the body / SEO / description never reach the list markup.
export type WorkCard = Pick<WorkRow, 'id' | 'slug' | 'title' | 'type' | 'year' | 'thumbnail'>;

export const toWorkCard = ({ id, slug, title, type, year, thumbnail }: WorkRow): WorkCard => (thumbnail === undefined ? { id, slug, title, type, year } : { id, slug, title, type, year, thumbnail });

// AdjacentNav renders only the neighbour's slug and title.
export type WorkLink = Pick<WorkRow, 'id' | 'slug' | 'title'>;

export const toWorkLink = (work: WorkRow | undefined): WorkLink | undefined => (work === undefined ? undefined : { id: work.id, slug: work.slug, title: work.title });
