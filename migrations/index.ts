import * as migration_20260608_220625_initial from './20260608_220625_initial';
import * as migration_20260608_230307_seed_news from './20260608_230307_seed_news';
import * as migration_20260608_230313_seed_logs from './20260608_230313_seed_logs';
import * as migration_20260609_000001_seed_works from './20260609_000001_seed_works';
import * as migration_20260609_000002_seed_blog from './20260609_000002_seed_blog';
import * as migration_20260609_000003_seed_gallery from './20260609_000003_seed_gallery';
import * as migration_20260609_000004_seed_profile from './20260609_000004_seed_profile';

export const migrations = [
  {
    up: migration_20260608_220625_initial.up,
    down: migration_20260608_220625_initial.down,
    name: '20260608_220625_initial',
  },
  {
    up: migration_20260608_230307_seed_news.up,
    down: migration_20260608_230307_seed_news.down,
    name: '20260608_230307_seed_news',
  },
  {
    up: migration_20260608_230313_seed_logs.up,
    down: migration_20260608_230313_seed_logs.down,
    name: '20260608_230313_seed_logs',
  },
  {
    up: migration_20260609_000001_seed_works.up,
    down: migration_20260609_000001_seed_works.down,
    name: '20260609_000001_seed_works',
  },
  {
    up: migration_20260609_000002_seed_blog.up,
    down: migration_20260609_000002_seed_blog.down,
    name: '20260609_000002_seed_blog',
  },
  {
    up: migration_20260609_000003_seed_gallery.up,
    down: migration_20260609_000003_seed_gallery.down,
    name: '20260609_000003_seed_gallery',
  },
  {
    up: migration_20260609_000004_seed_profile.up,
    down: migration_20260609_000004_seed_profile.down,
    name: '20260609_000004_seed_profile'
  },
];
