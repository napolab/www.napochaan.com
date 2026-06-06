// Decides whether a nav item should render as the active page.
//
// - index target ('/'): active iff the pathname is exactly '/'.
// - real-route target (e.g. '/works'): active on the exact route or any nested
//   route under it ('/works', '/works/abc') — but not a mere prefix sibling
//   ('/workshop').
// - home-anchor target (e.g. '/#about'): a transitional jump to a home section,
//   never a "page", so never page-active.
export const isNavActive = (pathname: string, target: string): boolean => {
  if (target.includes('#')) return false;
  if (target === '/') return pathname === '/';

  return pathname === target || pathname.startsWith(`${target}/`);
};
