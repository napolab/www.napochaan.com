import type { Plugin } from '../../lib/first-match-runner';

// pathname は percent-decode 済み(safeDecodePathname の結果)。plugin 側で decode し直さない。
export type PathRequest = { method: string; pathname: string; headers: Headers };

export type FramePolicy = { frameAncestors: string; xFrameOptions: string };

export type PathAction = { kind: 'redirect'; location: string } | { kind: 'frame'; policy: FramePolicy };

export type PathPolicyPlugin = Plugin<PathRequest, PathAction>;
