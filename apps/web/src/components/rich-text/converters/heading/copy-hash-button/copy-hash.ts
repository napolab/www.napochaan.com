// Framework-free core of the copy-anchor, shared by the React CopyHashButton
// (./index.tsx) and the `<copy-hash-button>` custom element (./element.ts).

// How long `data-copied` (the accent flash) stays on after a successful copy.
export const COPIED_RESET_MS = 800;

// This page's `#slug` deep link.
export const hashURL = (slug: string): string => new URL(`#${slug}`, window.location.href).href;

// Copies the deep link; resolves whether the clipboard write succeeded (a denied write
// is logged, never thrown — the press still goes on to jump to the heading).
export const copyHashLink = async (slug: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(hashURL(slug));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// The heading an `anchored` button sits in.
export const enclosingHeading = (element: Element): Element | null => element.closest('h1, h2, h3, h4, h5, h6');
