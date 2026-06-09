import * as migration_20260608_220625_initial from './20260608_220625_initial';
import * as migration_20260609_035457 from './20260609_035457';

export const migrations = [
  {
    up: migration_20260608_220625_initial.up,
    down: migration_20260608_220625_initial.down,
    name: '20260608_220625_initial',
  },
  {
    up: migration_20260609_035457.up,
    down: migration_20260609_035457.down,
    name: '20260609_035457'
  },
];
