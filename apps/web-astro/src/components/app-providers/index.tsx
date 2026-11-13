import { RouterProvider } from 'react-aria-components';

import { MotionProvider } from '@components/motion-provider';
import { PathnameProvider, useRouter } from '@lib/navigation';

import type { ComponentType, ReactNode } from 'react';

// The per-island replacement for the providers the Next root layout wrapped around
// the whole tree. Every Astro island is its own React root, so a provider rendered in
// `.astro` never reaches it; each island wraps itself instead:
//   - PathnameProvider: SSR pathname from `Astro.url.pathname` (hydration matches),
//     then `usePathname` follows `astro:page-load`.
//   - RouterProvider: react-aria Link / MenuItem navigate through Astro's ClientRouter
//     `navigate` (soft navigation, persisted islands survive).
//   - MotionProvider (uncontrolled): its value derives from module-level stores, so
//     instances in different islands agree and the SysBar toggle reaches them all.
// Boot status, the life engine and presence are module-level stores (no provider).

type Props = {
  pathname: string;
  children: ReactNode;
};

const AriaRouter = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  return <RouterProvider navigate={router.push}>{children}</RouterProvider>;
};

export const AppProviders = ({ pathname, children }: Props) => (
  <PathnameProvider pathname={pathname}>
    <AriaRouter>
      <MotionProvider>{children}</MotionProvider>
    </AriaRouter>
  </PathnameProvider>
);

export type IslandProps<P> = {
  // `Astro.url.pathname` of the rendering page.
  pathname: string;
  props: P;
};

// Turns a component into an island entry point wrapped in AppProviders. `.astro`
// props are not type-checked by tsgo, so a forgotten `pathname` throws on render
// instead of silently rendering every nav item inactive.
export const withAppProviders = <P extends object>(Component: ComponentType<P>) => {
  const Island = ({ pathname, props }: IslandProps<P>) => {
    if (typeof pathname !== 'string') throw new Error(`${Component.displayName ?? Component.name} island needs a \`pathname\` prop (Astro.url.pathname)`);

    return (
      <AppProviders pathname={pathname}>
        <Component {...props} />
      </AppProviders>
    );
  };

  return Island;
};
