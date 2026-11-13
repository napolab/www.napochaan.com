import { findNewsList } from '@lib/cms/news';

import { paginateNews } from './lib/paginate-news';

import type { NewsPage } from './lib/paginate-news';

// One page of the published archive; `undefined` past the last page (the route's 404).
export const loadNewsList = async (page: number): Promise<NewsPage | undefined> => paginateNews(await findNewsList(), page);
