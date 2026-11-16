// Agent Skills Discovery index (`/.well-known/agent-skills/index.json`, RFC v0.2.0,
// https://github.com/cloudflare/agent-skills-discovery-rfc). Each entry is a single
// SKILL.md (`skill-md`) with the SHA-256 digest of the exact bytes its route serves.

const AGENT_SKILLS_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

export type AgentSkillDescriptor = { name: string; description: string; digest: string };

type AgentSkillEntry = AgentSkillDescriptor & { type: 'skill-md'; url: string };

export type AgentSkillsIndex = { $schema: typeof AGENT_SKILLS_SCHEMA; skills: AgentSkillEntry[] };

type BuildAgentSkillsIndexArgs = { baseUrl: string; skills: readonly AgentSkillDescriptor[] };

export const agentSkillPath = (name: string): string => `/.well-known/agent-skills/${name}/SKILL.md`;

const toEntry =
  (baseUrl: string) =>
  ({ name, description, digest }: AgentSkillDescriptor): AgentSkillEntry => ({ name, type: 'skill-md', description, url: `${baseUrl}${agentSkillPath(name)}`, digest });

export const buildAgentSkillsIndex = ({ baseUrl, skills }: BuildAgentSkillsIndexArgs): AgentSkillsIndex => ({ $schema: AGENT_SKILLS_SCHEMA, skills: skills.map(toEntry(baseUrl)) });
