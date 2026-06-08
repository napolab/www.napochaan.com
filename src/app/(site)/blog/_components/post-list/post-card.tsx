'use client';

import { useState } from 'react';

import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { SystemAnnotation } from '@components/system-annotation';
import { link } from '@styled/recipes';
import { clsx } from '@utils/clsx';
import { dayjs } from '@utils/dayjs';

import * as s from './styles.css';

type Post = {
  id: string;
  index: string;
  title: string;
  readMin: number;
  date: string;
  excerpt: string;
};

// One post as a clickable card. On hover the title scrambles and decodes (a
// terminal/command-line reveal) via the shared ScrambleText island — the `group`
// trigger listens on this card's <a>, so hovering anywhere decodes the title.
// `aria-label` keeps the link's accessible name the title while the glyphs churn.
export const PostCard = ({ post }: { post: Post }) => {
  const [card, setCard] = useState<HTMLAnchorElement | null>(null);

  return (
    <Link ref={setCard} className={s.card} aria-label={post.title} href={`/blog/${post.id}`} tone="inherit" underline={false}>
      <span className={s.index}>{post.index}</span>
      <span className={clsx(link({ tone: 'accent', underline: true, hideOutsideFocusRing: true }), s.title)}>
        <ScrambleText trigger="group" host={card}>
          {post.title}
        </ScrambleText>
      </span>
      <p className={s.meta}>
        <SystemAnnotation>{`${post.readMin} min`}</SystemAnnotation>
        <SystemAnnotation>{dayjs(post.date).tz('Asia/Tokyo').format('YYYY.MM.DD')}</SystemAnnotation>
      </p>
      <p className={s.excerpt}>{post.excerpt}</p>
    </Link>
  );
};
