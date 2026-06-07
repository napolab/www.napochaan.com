import { Link } from '@components/link';
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
        <Link href={`/news/${slot.item.id}`} className={s.link} data-side={slot.side} tone="inherit" underline={false}>
          {slot.side === 'prev' ? (
            <span className={s.arrow} aria-hidden="true">
              ‹
            </span>
          ) : null}
          <span className={s.label}>
            <ScrambleText>{slot.item.title}</ScrambleText>
          </span>
          {slot.side === 'next' ? (
            <span className={s.arrow} aria-hidden="true">
              ›
            </span>
          ) : null}
        </Link>
      );
  }
};

// Prev / next navigation between adjacent news items, plus a back link to the
// index. A Server Component — `@components/link` is a styled RSC anchor.
export const NewsNav = ({ prev, next }: Props) => {
  return (
    <nav className={s.root} aria-label="news pagination">
      <div className={s.pager}>
        <NavSlot slot={toSlot('prev', prev)} />
        <NavSlot slot={toSlot('next', next)} />
      </div>
      <Link href="/news" className={s.back} tone="subtle">
        ← <ScrambleText>news 一覧</ScrambleText>
      </Link>
    </nav>
  );
};
