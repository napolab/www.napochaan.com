import { ScrambleText } from '@components/scramble-text';
import { SystemAnnotation } from '@components/system-annotation';
import { Tag } from '@components/tag';
import { dayjs } from '@utils/dayjs';

import * as s from './styles.css';

type Post = {
  id: string;
  index: string;
  title: string;
  source: string;
  readMin: number;
  date: string;
  excerpt: string;
};

// One post as a clickable card. On hover the title scrambles and decodes (a
// terminal/command-line reveal) via the shared ScrambleText island — the `group`
// trigger listens on this card's <a>, so hovering anywhere decodes the title.
// `aria-label` keeps the link's accessible name the title while the glyphs churn.
export const PostCard = ({ post }: { post: Post }) => {
  return (
    <a href={`/blog/${post.id}`} className={s.card} aria-label={post.title}>
      <span className={s.index}>{post.index}</span>
      <ScrambleText trigger="group" className={s.title}>
        {post.title}
      </ScrambleText>
      <p className={s.meta}>
        <Tag tone="outline">{post.source}</Tag>
        <SystemAnnotation>{`${post.readMin} min`}</SystemAnnotation>
        <SystemAnnotation>{dayjs(post.date).tz('Asia/Tokyo').format('YYYY.MM.DD')}</SystemAnnotation>
      </p>
      <p className={s.excerpt}>{post.excerpt}</p>
    </a>
  );
};
