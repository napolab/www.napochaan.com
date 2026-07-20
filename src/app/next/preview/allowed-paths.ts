// Allowlist of preview-route prefixes the /next/preview handshake may redirect to.
// A bare `startsWith('/')` would let protocol-relative URLs like `//evil.com`
// through and turn the handshake into an open redirect, so every entry pins a
// concrete `/<slug>/preview` prefix. Detail collections carry a trailing id
// segment (`/works/preview/<id>`, `/legal/preview/<id>`); aggregate previews
// (gallery, logs) have none.
//
// Keep in sync with the `draftPreviewRoute` buildPath prefixes in
// payload.config.ts — adding a previewable collection means adding it BOTH there
// and here (forgetting here makes the iframe 400).
export const PREVIEW_PATH_PREFIXES = ['/news/preview/', '/works/preview/', '/blog/preview/', '/gallery/preview', '/log/preview', '/legal/preview/'] as const;

export const isAllowedPreviewPath = (path: string | null): path is string => path !== null && PREVIEW_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
