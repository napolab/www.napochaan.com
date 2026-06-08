import * as migration_20260608_185333_initial from './20260608_185333_initial';

export const migrations = [
  {
    up: migration_20260608_185333_initial.up,
    down: migration_20260608_185333_initial.down,
    name: '20260608_185333_initial'
  },
];
