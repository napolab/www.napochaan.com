import { PostCard } from './post-card';
import * as s from './styles.css';

// Narrow row shape — the list never reads a post's body, so it isn't required.
type Row = {
  id: string;
  slug: string;
  index: string;
  title: string;
  readMin: number;
  date: string;
  excerpt: string;
};

type Props = {
  posts: readonly Row[];
};

// The full editorial feed. A Server Component — each post is a PostCard client
// island that scrambles its title on hover.
export const PostList = ({ posts }: Props) => {
  return (
    <ol className={s.list}>
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ol>
  );
};
