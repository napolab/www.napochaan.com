import { when } from '../../../../lib/first-match-runner';
import { anyOf } from '../../../../lib/predicate';
import { frameWith } from '../../actions';
import { isWithinPath } from '../../../../lib/path-predicate';
import { byPathname } from '../../predicates/request';

import type { FramePolicy, PathPolicyPlugin, PathRequest } from '../../types';

// Draft preview routes the cms admin embeds in its Live Preview iframe, plus the
// `/next/preview` handshake the iframe loads first. Keep in sync with
// PREVIEW_PATH_PREFIXES (src/lib/preview/allowed-paths.ts) — asserted by preview-frame.test.ts.
export const PREVIEW_ROOTS = ['/blog/preview', '/news/preview', '/works/preview', '/gallery/preview', '/log/preview', '/next/preview'] as const;

const isPreviewPath = anyOf(...PREVIEW_ROOTS.map(isWithinPath));

// The admin lives on the cms origin, so it must be allowed as a frame ancestor.
// Without a configured cms origin, fall back to same-origin framing only.
const previewFraming = ({ cmsOrigin }: PathRequest): FramePolicy => ({
  frameAncestors: cmsOrigin === undefined ? "frame-ancestors 'self'" : `frame-ancestors 'self' ${cmsOrigin}`,
});

export const previewFramePlugin: PathPolicyPlugin = when(byPathname(isPreviewPath), (request) => frameWith(previewFraming(request)));
