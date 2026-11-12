import { when } from '../../../../lib/first-match-runner';
import { hasPrefix } from '../../../../lib/path-predicate';
import { fillWith } from '../../directives';
import { MEDIA_POLICY } from '../../policies';

import type { CacheControlPlugin } from '../../types';

// 生の pathname(= Workers Cache のキー)で判定する。encode された path は media を外れ、後段の api plugin で no-store になる
// (安全側: public に保存されることは無い)。
export const mediaPlugin: CacheControlPlugin = when(hasPrefix('/api/media/file/'), () => fillWith(MEDIA_POLICY));
