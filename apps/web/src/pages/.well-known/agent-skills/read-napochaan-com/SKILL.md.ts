import { buildReadSiteSkill } from '@utils/agent-discovery/build-read-site-skill';
import { markdownResponse } from '@utils/markdown/response';

import type { APIRoute } from 'astro';

// The skill file itself. The Agent Skills spec fixes the file name `SKILL.md` (hence the
// upper-case route file), and index.json advertises the SHA-256 of these exact bytes.
export const GET: APIRoute = () => markdownResponse(buildReadSiteSkill({ baseUrl: process.env.BASE_URL ?? 'http://localhost:3000' }));
