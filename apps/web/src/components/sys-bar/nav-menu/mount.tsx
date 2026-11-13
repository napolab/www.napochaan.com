import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { AppProviders } from '@components/app-providers';
import { usePathname } from '@lib/navigation';

import { AriaNavMenu } from './menu';

import type { MenuHandoff } from './handoff';

// The lazily imported half of the <sys-bar> element's mobile menu: React, react-dom and
// the react-aria menu (MenuTrigger / Popover / Menu) only load with this chunk, on the
// static trigger's first intent — never on desktop, where the trigger is hidden.
//
// Mounts the unchanged AriaNavMenu (./menu) into the trigger's container. createRoot
// replaces the container's static trigger at the first commit, so the render is
// flushed synchronously: the handoff (read in the same task, including whether the
// static trigger had focus) is still true when AriaNavMenu's layout effect moves focus
// to the real trigger and applies a handed-off open. AppProviders gives MenuItem hrefs
// soft navigation (RouterProvider → astro:transitions navigate).

// The bar is persisted, so the menu may mount many soft navigations after the server
// render: seed the path from the location, then follow astro:page-load (usePathname).
const LiveNavMenu = ({ handoff }: { handoff: MenuHandoff }) => {
  const pathname = usePathname();
  const ref = useRef(handoff);

  return <AriaNavMenu pathname={pathname} handoff={ref} />;
};

type MountOptions = {
  container: HTMLElement;
  handoff: MenuHandoff;
};

export const mountNavMenu = ({ container, handoff }: MountOptions): (() => void) => {
  const root = createRoot(container);
  flushSync(() => {
    root.render(
      <AppProviders pathname={location.pathname}>
        <LiveNavMenu handoff={handoff} />
      </AppProviders>,
    );
  });

  return () => root.unmount();
};
