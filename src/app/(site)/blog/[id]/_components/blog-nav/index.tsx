import { ScrambleText } from '@components/scramble-text';

import * as s from './styles.css';

type Side = 'prev' | 'next';

type AdjacentItem = { id: string; title: string };

type Props = {
  prev?: AdjacentItem;
  next?: AdjacentItem;
};

// One directional slot. Modeled as a present/absent discriminated union so the
// switch makes the two render paths explicit and balances the space-between
// layout: an absent neighbour renders an empty placeholder, keeping the other
// side pinned to its edge.
type Slot = { kind: 'present'; side: Side; item: AdjacentItem } | { kind: 'absent' };

const toSlot = (side: Side, item?: AdjacentItem): Slot => (item === undefined ? { kind: 'absent' } : { kind: 'present', side, item });

const NavSlot = ({ slot }: { slot: Slot }) => {
  switch (slot.kind) {
    case 'absent':
      return <span className={s.empty} aria-hidden="true" />;
    case 'present':
      return (
        <a href={`/blog/${slot.item.id}`} className={s.link} data-side={slot.side}>
          {slot.side === 'prev' ? (
            <span className={s.arrow} aria-hidden="true">
              ‹
            </span>
          ) : null}
          <span className={s.label}>
            <ScrambleText trigger="group">{slot.item.title}</ScrambleText>
          </span>
          {slot.side === 'next' ? (
            <span className={s.arrow} aria-hidden="true">
              ›
            </span>
          ) : null}
        </a>
      );
  }
};

// Prev / next navigation between adjacent posts, plus a back link to the index. A
// Server Component. Uses plain `<a>` (not @components/link) — the styled link's
// fill-on-hover treatment bleeds across nav rows.
export const BlogNav = ({ prev, next }: Props) => {
  return (
    <nav className={s.root} aria-label="blog pagination">
      <div className={s.pager}>
        <NavSlot slot={toSlot('prev', prev)} />
        <NavSlot slot={toSlot('next', next)} />
      </div>
      <a href="/blog" className={s.back}>
        ← <ScrambleText trigger="group">blog 一覧</ScrambleText>
      </a>
    </nav>
  );
};
