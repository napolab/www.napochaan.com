import { when } from '../../../../lib/first-match-runner';
import { frameWith } from '../../actions';
import { isWithinPath } from '../../predicates/path';
import { byPathname } from '../../predicates/request';

import type { FramePolicy, PathPolicyPlugin } from '../../types';

// Access が有効だと admin はクロスサイトの iframe の中でも認証済みで描画される。admin 自身を
// iframe に入れる画面は無い(Live Preview が iframe に入れるのは /next/preview → サイト側の
// preview ページで、/admin ではない)ので、同一 origin 以外からの埋め込みを禁止する。
export const SAME_ORIGIN_FRAMING: FramePolicy = { frameAncestors: "frame-ancestors 'self'", xFrameOptions: 'SAMEORIGIN' };

const ADMIN_ROOT = '/admin';

export const adminFramePlugin: PathPolicyPlugin = when(byPathname(isWithinPath(ADMIN_ROOT)), () => frameWith(SAME_ORIGIN_FRAMING));
