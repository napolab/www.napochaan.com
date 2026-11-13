import { navigate } from 'astro:transitions/client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { ReactNode } from 'react';

// Astro replacement for `next/navigation`'s `usePathname` / `useRouter`.
//
// The server has no `location`, so the SSR pathname comes from the page
// (`<PathnameProvider pathname={Astro.url.pathname}>`) and the first client
// render reads the same value — hydration matches. After that the hook follows
// `location.pathname`, re-read on every `astro:page-load` (fired after each
// ClientRouter navigation), so a `transition:persist` island stays current.

const PAGE_LOAD_EVENT = 'astro:page-load';

const PathnameContext = createContext<string>('/');

type PathnameProviderProps = { pathname: string; children: ReactNode };

export const PathnameProvider = ({ pathname, children }: PathnameProviderProps) => <PathnameContext value={pathname}>{children}</PathnameContext>;

export const usePathname = (): string => {
  const serverPathname = useContext(PathnameContext);
  const [pathname, setPathname] = useState(serverPathname);

  useEffect(() => {
    const syncPathname = () => setPathname(location.pathname);
    document.addEventListener(PAGE_LOAD_EVENT, syncPathname);

    return () => document.removeEventListener(PAGE_LOAD_EVENT, syncPathname);
  }, []);

  return pathname;
};

export type Router = {
  push: (href: string) => void;
  replace: (href: string) => void;
  refresh: () => void;
};

const push = (href: string): void => {
  void navigate(href);
};

const replace = (href: string): void => {
  void navigate(href, { history: 'replace' });
};

const refresh = (): void => {
  void navigate(location.href, { history: 'replace' });
};

export const useRouter = (): Router => useMemo(() => ({ push, replace, refresh }), []);
