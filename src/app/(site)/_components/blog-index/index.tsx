import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { SectionHeading } from '@components/section-heading';
import { SystemAnnotation } from '@components/system-annotation';
import { Tag } from '@components/tag';

import * as styles from './styles.css';

type Post = {
  id: string;
  index: string;
  title: string;
  source: string;
  readMin: number;
  date: string;
  excerpt: string;
  href: string;
};

type Props = {
  id?: string;
  posts: Post[];
};

export const BlogIndex = ({ id, posts }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="05" more="zenn / blog →" moreHref="/blog">
        blog
      </SectionHeading>
      <ol className={styles.list}>
        {posts.map((post) => (
          <li key={post.id} className={styles.post}>
            <span className={styles.index}>{post.index}</span>
            <Link href={post.href} tone="accent" className={styles.title}>
              <ScrambleText>{post.title}</ScrambleText>
            </Link>
            <p className={styles.meta}>
              <Tag tone="outline">{post.source}</Tag>
              <SystemAnnotation>{`${post.readMin} min`}</SystemAnnotation>
              <SystemAnnotation>{post.date}</SystemAnnotation>
            </p>
            <p className={styles.excerpt}>{post.excerpt}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};
