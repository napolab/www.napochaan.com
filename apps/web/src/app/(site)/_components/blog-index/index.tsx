import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { SectionHeading } from '@components/section-heading';
import { SystemAnnotation } from '@components/system-annotation';

import * as styles from './styles.css';

import type { Post } from '../../blog/_lib/post';

type Props = {
  id?: string;
  posts: readonly Post[];
};

export const BlogIndex = ({ id, posts }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="05" more="$ cat blog/" moreHref="/blog">
        blog
      </SectionHeading>
      <ol className={styles.list}>
        {posts.map((post) => (
          <li key={post.id} className={styles.post}>
            <span className={styles.index}>{post.index}</span>
            <Link href={`/blog/${post.slug}`} tone="accent" className={styles.title}>
              <ScrambleText>{post.title}</ScrambleText>
            </Link>
            <p className={styles.meta}>
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
