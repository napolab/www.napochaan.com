import { when } from '../../../../lib/first-match-runner';
import { hasPrefix } from '../../../../lib/path-predicate';
import { PRIVATE_POLICY } from '../../policies';

import type { CacheControlPlugin } from '../../types';

// Payload の REST API は 200 JSON に Cache-Control を付けない。Workers Cache は header 無しの 200 を
// path+query キー・cookie 無視で 2h 保存するため、admin のセッション応答が匿名に再生されたり、
// 匿名応答が admin に返ったりする。media(registry で先に評価される)以外の /api/ は保存させない。
export const apiPlugin: CacheControlPlugin = when(hasPrefix('/api/'), () => PRIVATE_POLICY);
