import { buildAgentSkillsIndex } from '@utils/agent-discovery/build-agent-skills-index';
import { buildReadSiteSkill, READ_SITE_SKILL } from '@utils/agent-discovery/build-read-site-skill';
import { discoveryJSONResponse } from '@utils/agent-discovery/discovery-json-response';
import { sha256Digest } from '@utils/agent-discovery/sha256-digest';

import type { APIRoute } from 'astro';

// Agent Skills Discovery index (v0.2.0). The digest is computed from the same builder
// output the SKILL.md route serves, so the two cannot drift. Deploy-constant body.
export const GET: APIRoute = async () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const digest = await sha256Digest(buildReadSiteSkill({ baseUrl }));

  return discoveryJSONResponse(buildAgentSkillsIndex({ baseUrl, skills: [{ ...READ_SITE_SKILL, digest }] }));
};
