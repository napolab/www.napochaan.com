'use client';

import { Fragment } from 'react';
import { Link } from 'react-aria-components';

import { Image } from '@components/image';
import { clsx } from '@utils/clsx';

import { groupByYear } from './group-by-year';
import * as s from './styles.css';

import type { CSSProperties } from 'react';

export type WorkRow = {
  id: string;
  no: string;
  title: string;
  type: string;
  year: number;
  thumbnail?: { src: string; width: number; height: number };
};

type Props = {
  works: readonly WorkRow[];
};

// The per-spine vertical offset within the sticky stack, driven by the group's
// DOM order (newest-first). A CSS custom property — the only style-prop bridge
// allowed by dynamic-styles.md — consumed by s.spine for `top` / scrollMarginTop.
const spineStyle = (index: number): CSSProperties => ({ '--spine-index': index }) as CSSProperties;

// The blurred ambient background url for a row, set as a CSS variable so the
// fixed s.ambient layer can paint this row's thumb on hover.
const ambientStyle = (src: string): CSSProperties => ({ '--thumb': `url(${src})` }) as CSSProperties;

// A single work row rendered as a block link to its detail page. Uses the
// react-aria Link (client-routes through the app's RouterProvider) — it ships
// unstyled, so s.item fully owns the look. The thumb carries the work title as
// alt. Rendered from a Server Component as a client leaf (children are
// server-rendered).
const WorkItem = ({ work }: { work: WorkRow }) => {
  const { thumbnail } = work;

  return (
    <li>
      <Link href={`/works/${work.id}`} className={clsx(s.item, 'group')}>
        {thumbnail === undefined ? null : <span className={s.ambient} aria-hidden="true" style={ambientStyle(thumbnail.src)} />}
        {thumbnail === undefined ? (
          <span className={s.thumbPlaceholder} aria-hidden="true" />
        ) : (
          <Image src={thumbnail.src} alt={work.title} width={thumbnail.width} height={thumbnail.height} className={s.thumb} />
        )}
        <span className={s.title}>{work.title}</span>
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
            <Link href={`#year-${group.year}`} className={s.spineLink}>
              {group.year}
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
