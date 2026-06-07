'use client';

import { Fragment, useState } from 'react';

import { Image } from '@components/image';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { link } from '@styled/recipes';
import { clsx } from '@utils/clsx';

import { groupByYear } from './group-by-year';
import * as s from './styles.css';

import type { CSSProperties } from 'react';

type ArchiveItem = {
  id: string;
  title: string;
  type: string;
  year: number;
  thumbnail?: { src: string; width: number; height: number };
};

type Props = {
  works: readonly ArchiveItem[];
};

// The per-spine vertical offset within the sticky stack, driven by the group's
// DOM order (newest-first). A CSS custom property — the only style-prop bridge
// allowed by dynamic-styles.md — consumed by s.spine for `top` / scrollMarginTop.
const spineStyle = (index: number): CSSProperties => ({ '--spine-index': index }) as CSSProperties;

// The blurred ambient background url for a row, set as a CSS variable so the
// fixed s.ambient layer can paint this row's thumb on hover.
const ambientStyle = (src: string): CSSProperties => ({ '--thumb': `url(${src})` }) as CSSProperties;

// A single work row rendered as a block link to its detail page via the shared
// `Link` (a plain styled anchor). `hideOutsideFocusRing` defers to s.item's own inset
// focus indicator (the row spans a clip box); `tone="inherit"` keeps s.item's
// colour. The title itself wears the inline-link look (accent + underline) so the
// row reads as a link; the whole card stays the click target.
const WorkItem = ({ work }: { work: ArchiveItem }) => {
  const { thumbnail } = work;
  const [card, setCard] = useState<HTMLAnchorElement | null>(null);

  return (
    <li>
      <Link ref={setCard} href={`/works/${work.id}`} className={clsx(s.item, 'group')} tone="inherit" underline={false} hideOutsideFocusRing>
        {thumbnail === undefined ? null : <span className={s.ambient} aria-hidden="true" style={ambientStyle(thumbnail.src)} />}
        {thumbnail === undefined ? (
          <span className={s.thumbPlaceholder} aria-hidden="true" />
        ) : (
          <Image src={thumbnail.src} alt={work.title} width={thumbnail.width} height={thumbnail.height} className={s.thumb} />
        )}
        <span className={clsx(link({ tone: 'accent', underline: true, hideOutsideFocusRing: true }), s.title)}>
          <ScrambleText trigger="group" host={card}>
            {work.title}
          </ScrambleText>
        </span>
        <span className={s.type}>{work.type}</span>
        <span className={s.arrow} aria-hidden="true">
          →
        </span>
      </Link>
    </li>
  );
};

export const WorksArchive = ({ works }: Props) => {
  const groups = groupByYear(works);

  return (
    <section className={s.root} aria-label="works archive">
      {groups.map((group, index) => (
        <Fragment key={group.year}>
          {/* Non-sticky hash target at the year's natural position. The spine
              itself is sticky, so anchoring to it would barely scroll once it's
              pinned; this marker scrolls to the section start. */}
          <span id={`year-${group.year}`} className={s.anchor} style={spineStyle(index)} aria-hidden="true" />
          <h2 id={`year-${group.year}-heading`} className={s.spine} style={spineStyle(index)}>
            <Link href={`#year-${group.year}`} className={s.spineLink} tone="inherit" underline={false} hideOutsideFocusRing>
              <ScrambleText>{`${group.year}`}</ScrambleText>
            </Link>
          </h2>
          <ul className={s.rows} aria-labelledby={`year-${group.year}-heading`}>
            {group.items.map((work) => (
              <WorkItem key={work.id} work={work} />
            ))}
          </ul>
        </Fragment>
      ))}
    </section>
  );
};
