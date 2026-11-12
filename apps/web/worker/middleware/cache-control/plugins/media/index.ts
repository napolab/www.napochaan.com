import { when } from '../../../../lib/first-match-runner';
import { hasPrefix } from '../../../../lib/path-predicate';
import { MEDIA_POLICY } from '../../policies';

import type { CacheControlPlugin } from '../../types';

export const mediaPlugin: CacheControlPlugin = when(hasPrefix('/api/media/file/'), () => MEDIA_POLICY);
