import { findBlogList } from '@lib/cms/blog';

import { paginatePosts } from './lib/paginate-posts';

import type { PostPage } from './lib/paginate-posts';

// One page of the published feed; `undefined` past the last page (the route's 404).
export const loadBlogList = async (page: number): Promise<PostPage | undefined> => paginatePosts(await findBlogList(), page);
