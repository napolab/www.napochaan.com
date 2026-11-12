import type { Plugin } from '../../lib/first-match-runner';

// pathname は percent-decode 済み(safeDecodePathname の結果)。plugin 側で decode し直さない。
// cmsOrigin は env.CMS_ORIGIN(未設定なら undefined)。
export type PathRequest = { method: string; pathname: string; headers: Headers; cmsOrigin?: string };

// X-Frame-Options はクロスオリジンの親を許可できないので持たない(frame を許す時は常に外す)。
export type FramePolicy = { frameAncestors: string };

export type PathAction = { kind: 'redirect'; location: string } | { kind: 'frame'; policy: FramePolicy };

export type PathPolicyPlugin = Plugin<PathRequest, PathAction>;
