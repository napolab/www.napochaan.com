'use client';

import { useState } from 'react';

import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { link } from '@styled/recipes';
import { clsx } from '@utils/clsx';

import * as s from './styles.css';

type RelatedWork = {
  id: string;
  title: string;
  type: string;
  thumbnail?: { src: string; width: number; height: number };
};

type Props = {
  works: readonly RelatedWork[];
};

// A related work card: a block link to the work's detail page carrying the
// contact-sheet grayscale thumb, title and type. Extracted so the thumbnail
// present/absent branch and the per-item link stay a small client leaf.
const RelatedItem = ({ work }: { work: RelatedWork }) => {
  const { thumbnail } = work;
  const [card, setCard] = useState<HTMLAnchorElement | null>(null);

  return (
    <li>
      <Link ref={setCard} href={`/works/${work.id}`} className={clsx(s.item, 'group')} tone="inherit" underline={false}>
        {thumbnail === undefined ? (
          <span className={s.thumbPlaceholder} aria-hidden="true" />
        ) : (
          <Image
            src={thumbnail.src}
            alt={work.title}
            width={thumbnail.width}
            height={thumbnail.height}
            className={s.thumb}
            placeholder="blur"
            blurDataURL={formatBlurURL(thumbnail.src, { blur: 20 })}
          />
        )}
        <span className={s.body}>
          <span className={clsx(link({ tone: 'accent', underline: true, hideOutsideFocusRing: true }), s.title)}>
            <ScrambleText trigger="group" host={card} clamp>
              {work.title}
            </ScrambleText>
          </span>
          <span className={s.type}>{work.type}</span>
        </span>
      </Link>
    </li>
  );
};

// The related-works rail: same-type siblings of the current work. Rendered as a
// client island because react-aria's Link needs the RouterProvider context.
export const RelatedWorks = ({ works }: Props) => {
  return (
    <section className={s.root} aria-labelledby="related-heading">
      <h2 id="related-heading" className={s.heading}>
        related / 関連
      </h2>
      <ul className={s.list}>
        {works.map((work) => (
          <RelatedItem key={work.id} work={work} />
        ))}
      </ul>
    </section>
  );
};
