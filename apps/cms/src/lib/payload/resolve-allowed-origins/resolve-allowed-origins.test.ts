import { describe, expect, it } from 'vitest';

import { resolveAllowedOrigins } from './index';

describe('resolveAllowedOrigins', () => {
  it('allows only the cms origin (staging)', () => {
    expect(resolveAllowedOrigins({ CMS_ORIGIN: 'https://cms-stg.napochaan.com' })).toEqual(['https://cms-stg.napochaan.com']);
  });

  it('allows only the cms origin (production)', () => {
    expect(resolveAllowedOrigins({ CMS_ORIGIN: 'https://cms.napochaan.com' })).toEqual(['https://cms.napochaan.com']);
  });

  it('never lets the web origin into the allowlist', () => {
    const origins = resolveAllowedOrigins({ CMS_ORIGIN: 'https://cms.napochaan.com' });

    expect(origins).not.toContain('https://napochaan.com');
  });
});
