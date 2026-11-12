import type { Media } from '@payload-types';

// A populated media upload (depth >= 1) is an object carrying url/width/height; an
// unpopulated one is just the numeric id. Narrows to the object case so callers
// can read the resolved Media fields without widening Payload's generated type.
export const isPopulatedMedia = (value: unknown): value is Media => typeof value === 'object' && value !== null && 'url' in value;
