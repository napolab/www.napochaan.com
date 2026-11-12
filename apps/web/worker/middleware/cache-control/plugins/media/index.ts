import { when } from '../../../../lib/first-match-runner';
import { hasPrefix } from '../../../../lib/path-predicate';
import { fillWith } from '../../directives';
import { MEDIA_POLICY } from '../../policies';

import type { CacheControlPlugin } from '../../types';

// 生の pathname(= Workers Cache のキー)で判定する。encode された path は catch-all(cms)に落ちる
// (media は公開物なので cms policy で保存されても漏れるものは無い)。
export const mediaPlugin: CacheControlPlugin = when(hasPrefix('/api/media/file/'), () => fillWith(MEDIA_POLICY));
