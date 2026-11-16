import { describe, expect, it } from 'vitest';

import { agentSkillPath, buildAgentSkillsIndex } from './index';

const DIGEST = `sha256:${'a'.repeat(64)}`;

describe('agentSkillPath', () => {
  it('places a skill at /.well-known/agent-skills/<name>/SKILL.md', () => {
    expect(agentSkillPath('read-napochaan-com')).toBe('/.well-known/agent-skills/read-napochaan-com/SKILL.md');
  });
});

describe('buildAgentSkillsIndex', () => {
  it('follows the Agent Skills Discovery v0.2.0 shape with one skill-md entry', () => {
    expect(buildAgentSkillsIndex({ baseUrl: 'https://napochaan.com', skills: [{ name: 'read-napochaan-com', description: 'd', digest: DIGEST }] })).toEqual({
      $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
      skills: [{ name: 'read-napochaan-com', type: 'skill-md', description: 'd', url: 'https://napochaan.com/.well-known/agent-skills/read-napochaan-com/SKILL.md', digest: DIGEST }],
    });
  });
});
