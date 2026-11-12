import { BlogIndex } from '../../../_components/blog-index';
import { findBlogList } from '@lib/cms/blog';

export const BlogIndexLoader = async () => {
  const blogPosts = await findBlogList();
  const homePosts = [...blogPosts].slice(0, 3);

  return <BlogIndex id="blog" posts={homePosts} />;
};
