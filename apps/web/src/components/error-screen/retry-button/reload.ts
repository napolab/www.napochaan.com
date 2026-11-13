// The retry's action, shared by the React RetryButton (./index.tsx) and the
// `<retry-button>` custom element (./element.ts). Next's `reset()` re-rendered the
// failed segment from the `'use client'` error.tsx; a server-rendered Astro page has no
// client segment to reset, so retry reloads the document.
export const reloadPage = (): void => {
  location.reload();
};
