import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import { toSlot } from './slot';
import * as s from './styles.css';

import type { AdjacentItem, Slot } from './slot';

type Props = {
  prev?: AdjacentItem;
  next?: AdjacentItem;
};

const NavSlot = ({ slot }: { slot: Slot }) => {
  switch (slot.kind) {
    case 'absent':
      return <span className={s.empty} aria-hidden="true" />;
    case 'present':
      return (
        <Link href={`/news/${slot.item.slug}`} className={s.link} data-side={slot.side} tone="inherit" underline={false}>
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
