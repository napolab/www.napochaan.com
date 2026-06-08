import * as migration_20260608_185333_initial from './20260608_185333_initial';
import * as migration_20260608_200515_works from './20260608_200515_works';

export const migrations = [
  {
    up: migration_20260608_185333_initial.up,
    down: migration_20260608_185333_initial.down,
    name: '20260608_185333_initial',
  },
  {
    up: migration_20260608_200515_works.up,
    down: migration_20260608_200515_works.down,
    name: '20260608_200515_works'
  },
];
