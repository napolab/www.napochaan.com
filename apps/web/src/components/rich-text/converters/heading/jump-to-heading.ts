// The copy-anchor's navigation half: bring the heading into view and put its fragment
// in the URL without adding a history entry. Shared by AnchoredHeading (React-owned
// heading) and an `anchored` CopyHashButton island (server-rendered heading).
export const jumpToHeading = (heading: Element | null | undefined, slug: string, reduced: boolean): void => {
  heading?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  history.replaceState(null, '', new URL(`#${slug}`, window.location.href).href);
};
