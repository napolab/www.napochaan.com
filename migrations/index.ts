import * as migration_20260608_220625_initial from './20260608_220625_initial';
import * as migration_20260609_035457 from './20260609_035457';
import * as migration_20260609_125502_works_no_drop_sort_news_orderable from './20260609_125502_works_no_drop_sort_news_orderable';
import * as migration_20260609_140033_works_drop_sort from './20260609_140033_works_drop_sort';
import * as migration_20260611_024735_add_news_pinned from './20260611_024735_add_news_pinned';
import * as migration_20260611_024807_drop_news_order from './20260611_024807_drop_news_order';
import * as migration_20260612_205858_blog_thumbnail from './20260612_205858_blog_thumbnail';
import * as migration_20260613_200316_add_slug from './20260613_200316_add_slug';

export const migrations = [
  {
    up: migration_20260608_220625_initial.up,
    down: migration_20260608_220625_initial.down,
    name: '20260608_220625_initial',
  },
  {
    up: migration_20260609_035457.up,
    down: migration_20260609_035457.down,
    name: '20260609_035457',
  },
  {
    up: migration_20260609_125502_works_no_drop_sort_news_orderable.up,
    down: migration_20260609_125502_works_no_drop_sort_news_orderable.down,
    name: '20260609_125502_works_no_drop_sort_news_orderable',
  },
  {
    up: migration_20260609_140033_works_drop_sort.up,
    down: migration_20260609_140033_works_drop_sort.down,
    name: '20260609_140033_works_drop_sort',
  },
  {
    up: migration_20260611_024735_add_news_pinned.up,
    down: migration_20260611_024735_add_news_pinned.down,
    name: '20260611_024735_add_news_pinned',
  },
  {
    up: migration_20260611_024807_drop_news_order.up,
    down: migration_20260611_024807_drop_news_order.down,
    name: '20260611_024807_drop_news_order',
  },
  {
    up: migration_20260612_205858_blog_thumbnail.up,
    down: migration_20260612_205858_blog_thumbnail.down,
    name: '20260612_205858_blog_thumbnail',
  },
  {
    up: migration_20260613_200316_add_slug.up,
    down: migration_20260613_200316_add_slug.down,
    name: '20260613_200316_add_slug'
  },
];
