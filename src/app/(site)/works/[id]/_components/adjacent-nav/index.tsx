'use client';

import { Link } from 'react-aria-components';

import { ScrambleText } from '@components/scramble-text';

import * as s from './styles.css';

type Side = 'prev' | 'next';

type AdjacentWork = { id: string; title: string };

type Props = {
  prev?: AdjacentWork;
  next?: AdjacentWork;
};

// One directional slot. Modeled as a present/absent discriminated union so the
// switch makes the two render paths explicit and balances the space-between
// layout: an absent neighbour renders an empty placeholder, keeping the other
// side pinned to its edge.
type Slot = { kind: 'present'; side: Side; work: AdjacentWork } | { kind: 'absent' };

const toSlot = (side: Side, work?: AdjacentWork): Slot => (work === undefined ? { kind: 'absent' } : { kind: 'present', side, work });

const NavSlot = ({ slot }: { slot: Slot }) => {
  switch (slot.kind) {
    case 'absent':
      return <span className={s.empty} aria-hidden="true" />;
    case 'present':
      return (
        <Link href={`/works/${slot.work.id}`} className={s.link} data-side={slot.side}>
          {slot.side === 'prev' ? (
            <span className={s.arrow} aria-hidden="true">
              ‹
            </span>
          ) : null}
          <span className={s.label}>
            <ScrambleText trigger="group">{slot.work.title}</ScrambleText>
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

// Prev / next navigation between adjacent works. Client island — react-aria's
// Link routes through the app RouterProvider.
export const AdjacentNav = ({ prev, next }: Props) => {
  return (
    <nav className={s.root} aria-label="works pagination">
      <NavSlot slot={toSlot('prev', prev)} />
      <NavSlot slot={toSlot('next', next)} />
    </nav>
  );
};
