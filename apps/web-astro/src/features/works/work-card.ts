import type { WorkRow } from './work-row';

// The fields the works client leaves (WorksArchive, RelatedWorks, AdjacentNav) render.
// Island props are serialized into the HTML, so the body / SEO / description never ride
// along.
export type WorkCard = Pick<WorkRow, 'id' | 'slug' | 'title' | 'type' | 'year' | 'thumbnail'>;

export const toWorkCard = ({ id, slug, title, type, year, thumbnail }: WorkRow): WorkCard => (thumbnail === undefined ? { id, slug, title, type, year } : { id, slug, title, type, year, thumbnail });

// AdjacentNav renders only the neighbour's slug and title.
export type WorkLink = Pick<WorkRow, 'id' | 'slug' | 'title'>;

export const toWorkLink = (work: WorkRow | undefined): WorkLink | undefined => (work === undefined ? undefined : { id: work.id, slug: work.slug, title: work.title });
