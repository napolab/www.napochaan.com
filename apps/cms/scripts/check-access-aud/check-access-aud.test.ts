import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { findAccessAUDProblems, readEnvVars } from './index.mjs';

const AUD = 'c582e273d62eadb31e060ca80660d5dbcc85b29076257bf71c5c8e37aded178e';

describe('findAccessAUDProblems', () => {
  it('passes when both AUDs are 64-hex Access AUD tags', () => {
    expect(findAccessAUDProblems({ CF_ACCESS_AUD: AUD, CF_ACCESS_MCP_AUD: AUD })).toEqual([]);
  });

  it.each([
    ['the env has no vars', undefined, ['CF_ACCESS_AUD', 'CF_ACCESS_MCP_AUD']],
    ['both are missing', { CF_ACCESS_TEAM_DOMAIN: 'napochaan' }, ['CF_ACCESS_AUD', 'CF_ACCESS_MCP_AUD']],
    ['the MCP AUD is missing', { CF_ACCESS_AUD: AUD }, ['CF_ACCESS_MCP_AUD']],
    ['an AUD is empty', { CF_ACCESS_AUD: '', CF_ACCESS_MCP_AUD: AUD }, ['CF_ACCESS_AUD']],
    ['an AUD is a placeholder', { CF_ACCESS_AUD: 'TODO', CF_ACCESS_MCP_AUD: '<aud>' }, ['CF_ACCESS_AUD', 'CF_ACCESS_MCP_AUD']],
    ['an AUD is too short', { CF_ACCESS_AUD: AUD.slice(1), CF_ACCESS_MCP_AUD: AUD }, ['CF_ACCESS_AUD']],
    ['an AUD is not a string', { CF_ACCESS_AUD: 1, CF_ACCESS_MCP_AUD: AUD }, ['CF_ACCESS_AUD']],
  ])('reports the offending vars when %s', (_label, vars, names) => {
    const problems = findAccessAUDProblems(vars);
    expect(problems).toHaveLength(names.length);
    for (const [index, name] of names.entries()) expect(problems[index]).toContain(name);
  });
});

const writeConfig = (content: string): string => {
  const path = join(mkdtempSync(join(tmpdir(), 'check-access-aud-')), 'wrangler.jsonc');
  writeFileSync(path, content);
  return path;
};

describe('readEnvVars', () => {
  const config = writeConfig(`{
    // comment
    "name": "x",
    "vars": { "CF_ACCESS_AUD": "top-level-is-ignored" },
    "env": {
      "staging": { "vars": { "CF_ACCESS_AUD": "${AUD}", "CF_ACCESS_MCP_AUD": "${AUD}", }, },
      "production": {
        "vars": {
          /* TODO: add CF_ACCESS_AUD */
          "CF_ACCESS_TEAM_DOMAIN": "napochaan",
        },
      },
    },
  }`);

  it('reads the named env vars from a JSONC file (comments, trailing commas)', () => {
    expect(readEnvVars(config, 'staging')).toEqual({ CF_ACCESS_AUD: AUD, CF_ACCESS_MCP_AUD: AUD });
  });

  it('does not fall back to top-level vars (wrangler vars are not inherited by envs)', () => {
    expect(findAccessAUDProblems(readEnvVars(config, 'production'))).toHaveLength(2);
  });

  it('returns undefined for an env that does not exist', () => {
    expect(readEnvVars(config, 'nope')).toBeUndefined();
  });
});
