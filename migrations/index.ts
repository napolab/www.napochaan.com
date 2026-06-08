import * as migration_20260608_185333_initial from './20260608_185333_initial';
import * as migration_20260608_200515_works from './20260608_200515_works';
import * as migration_20260608_201244_blog from './20260608_201244_blog';
import * as migration_20260608_202001_gallery from './20260608_202001_gallery';
import * as migration_20260608_203131_logs from './20260608_203131_logs';
import * as migration_20260608_204156_profile_global from './20260608_204156_profile_global';
import * as migration_20260608_205747_seed_works from './20260608_205747_seed_works';
import * as migration_20260608_205957_seed_blog from './20260608_205957_seed_blog';
import * as migration_20260608_210207_seed_gallery from './20260608_210207_seed_gallery';
import * as migration_20260608_210242_seed_profile from './20260608_210242_seed_profile';

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
    name: '20260608_203131_logs',
  },
  {
    up: migration_20260608_204156_profile_global.up,
    down: migration_20260608_204156_profile_global.down,
    name: '20260608_204156_profile_global',
  },
  {
    up: migration_20260608_205747_seed_works.up,
    down: migration_20260608_205747_seed_works.down,
    name: '20260608_205747_seed_works',
  },
  {
    up: migration_20260608_205957_seed_blog.up,
    down: migration_20260608_205957_seed_blog.down,
    name: '20260608_205957_seed_blog',
  },
  {
    up: migration_20260608_210207_seed_gallery.up,
    down: migration_20260608_210207_seed_gallery.down,
    name: '20260608_210207_seed_gallery',
  },
  {
    up: migration_20260608_210242_seed_profile.up,
    down: migration_20260608_210242_seed_profile.down,
    name: '20260608_210242_seed_profile'
  },
];
