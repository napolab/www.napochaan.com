export type Side = 'prev' | 'next';

export type AdjacentItem = { id: string; slug: string; title: string };

// One directional slot. Modeled as a present/absent discriminated union so the
// switch makes the two render paths explicit and balances the space-between
// layout: an absent neighbour renders an empty placeholder, keeping the other
// side pinned to its edge. Shared by the React NewsNav and its `.astro` twin.
export type Slot = { kind: 'present'; side: Side; item: AdjacentItem } | { kind: 'absent' };

export const toSlot = (side: Side, item?: AdjacentItem): Slot => (item === undefined ? { kind: 'absent' } : { kind: 'present', side, item });
