import type { FramePolicy, PathAction } from '../types';

export const redirectTo = (location: string): PathAction => ({ kind: 'redirect', location });

export const frameWith = (policy: FramePolicy): PathAction => ({ kind: 'frame', policy });
