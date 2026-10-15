import { describe, expect, test } from 'vitest';

import { InvalidAccessTeamDomain } from '../errors';
import { normalizeTeamDomain } from './index';

describe('normalizeTeamDomain', () => {
  test.each(['napolab', ' NapoLab ', 'napolab.cloudflareaccess.com', 'https://napolab.cloudflareaccess.com/', 'http://napolab.cloudflareaccess.com', 'HTTPS://NAPOLAB.CLOUDFLAREACCESS.COM//'])(
    'normalizes %j to the team name',
    (raw) => {
      expect(normalizeTeamDomain(raw)).toBe('napolab');
    },
  );

  test('keeps digits and hyphens', () => {
    expect(normalizeTeamDomain('napo-lab-2')).toBe('napo-lab-2');
  });

  test.each([undefined, '', '  '])('returns undefined for an unset value (%j)', (raw) => {
    expect(normalizeTeamDomain(raw)).toBeUndefined();
  });

  test.each(['my team', 'napolab.example.com', 'https://', 'napolab/admin', 'napo_lab'])('throws InvalidAccessTeamDomain for %j', (raw) => {
    expect(() => normalizeTeamDomain(raw)).toThrow(InvalidAccessTeamDomain);
  });

  test('names the raw value and the expected form in the message', () => {
    expect(() => normalizeTeamDomain('napolab.example.com')).toThrow(/"napolab\.example\.com".*`napolab`/);
  });
});
