import * as migration_20260608_155217_initial from './20260608_155217_initial';
import * as migration_20260608_163523_news_revalidate_and_remove_pages from './20260608_163523_news_revalidate_and_remove_pages';

export const migrations = [
  {
    up: migration_20260608_155217_initial.up,
    down: migration_20260608_155217_initial.down,
    name: '20260608_155217_initial',
  },
  {
    up: migration_20260608_163523_news_revalidate_and_remove_pages.up,
    down: migration_20260608_163523_news_revalidate_and_remove_pages.down,
    name: '20260608_163523_news_revalidate_and_remove_pages'
  },
];
