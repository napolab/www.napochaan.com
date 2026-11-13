import { describe, expect, it } from 'vitest';

import { fromLogManualItemDTO } from './index';

import type { LogManualItemDTO } from '@napochaan/cms-api/services';

const base: LogManualItemDTO = { id: 'l1', title: 'L', date: '2026-01-01', meta: 'm' };

describe('fromLogManualItemDTO', () => {
  it('omits the url key when absent', () => {
    expect(fromLogManualItemDTO(base)).toEqual(base);
    expect(fromLogManualItemDTO(base)).not.toHaveProperty('url');
  });

  it('keeps a present url', () => {
    expect(fromLogManualItemDTO({ ...base, url: 'https://x' }).url).toBe('https://x');
  });
});
