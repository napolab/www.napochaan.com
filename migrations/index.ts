import * as migration_20260608_185333_initial from './20260608_185333_initial';
import * as migration_20260608_200515_works from './20260608_200515_works';
import * as migration_20260608_201244_blog from './20260608_201244_blog';
import * as migration_20260608_202001_gallery from './20260608_202001_gallery';
import * as migration_20260608_203131_logs from './20260608_203131_logs';

export const migrations = [
  {
    up: migration_20260608_185333_initial.up,
    down: migration_20260608_185333_initial.down,
    name: '20260608_185333_initial',
  },
  {
    up: migration_20260608_200515_works.up,
    down: migration_20260608_200515_works.down,
    name: '20260608_200515_works',
  },
  {
    up: migration_20260608_201244_blog.up,
    down: migration_20260608_201244_blog.down,
    name: '20260608_201244_blog',
  },
  {
    up: migration_20260608_202001_gallery.up,
    down: migration_20260608_202001_gallery.down,
    name: '20260608_202001_gallery',
  },
  {
    up: migration_20260608_203131_logs.up,
    down: migration_20260608_203131_logs.down,
    name: '20260608_203131_logs'
  },
];
