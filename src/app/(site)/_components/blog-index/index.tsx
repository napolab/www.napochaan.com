import { Link } from '@components/link';
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
  posts: Post[];
};

export const BlogIndex = ({ posts }: Props) => {
  return (
    <section className={styles.root}>
      <SectionHeading no="05">blog</SectionHeading>
      <ol className={styles.list}>
        {posts.map((post) => (
          <li key={post.id} className={styles.post}>
            <span className={styles.index}>{post.index}</span>
            <Link href={post.href} className={styles.title}>
              {post.title}
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
