import { when } from '../../../../lib/first-match-runner';
import { isWithinPath } from '../../../../lib/path-predicate';
import { PRIVATE_POLICY } from '../../policies';

import type { CacheControlPlugin } from '../../types';

// /mcp は worker/routes/mcp が /api/mcp へ forward する MCP の公開入口。応答は Access JWT から
// 特定した user ごとのデータで、Workers Cache は header 無しの 200 を cookie・header 無視で保存する。
// 他人の応答が再生されないよう保存させない(/mcpfoo は対象外)。
export const mcpPlugin: CacheControlPlugin = when(isWithinPath('/mcp'), () => PRIVATE_POLICY);
