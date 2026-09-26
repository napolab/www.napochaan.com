import { describe, expect, it } from 'vitest';

import { resolveDeployEnv } from './index';

describe('resolveDeployEnv', () => {
  it.each(['staging', 'production'] as const)('keeps the remote deploy target %s', (env) => {
    expect(resolveDeployEnv(env)).toBe(env);
  });

  it.each([undefined, '', 'preview'])('treats %s as the local database', (value) => {
    expect(resolveDeployEnv(value)).toBeUndefined();
  });
});
