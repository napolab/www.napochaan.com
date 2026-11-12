// Single source of truth for the site's primary sections, shared by the top
// SysBar and the SiteFooter so the two navs can never drift. Order is the display
// order (index first → blog last); SysBar additionally uses the array index as
// each slot's collapse `order`.
export const siteNavItems = [
  { label: 'index', href: '/' },
  { label: 'about', href: '/about' },
  { label: 'works', href: '/works' },
  { label: 'news', href: '/news' },
  { label: 'log', href: '/log' },
  { label: 'gallery', href: '/gallery' },
  { label: 'blog', href: '/blog' },
] as const;
