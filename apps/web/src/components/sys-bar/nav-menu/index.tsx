import { Suspense, lazy, startTransition, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { INITIAL_HANDOFF } from './handoff';
import { MenuBoundary } from './menu-boundary';
import { MenuTriggerButton } from './trigger-button';

import type { PressEvent } from 'react-aria-components';
import type { MenuHandoff } from './handoff';

// The react-aria menu (MenuTrigger / Popover / Menu — the overlay + collection code)
// is a separate chunk, fetched on the first intent instead of with the SysBar.
const AriaNavMenu = lazy(async () => {
  const { AriaNavMenu: Menu } = await import('./menu');
  return { default: Menu };
});

type PlaceholderProps = {
  onPressStart: (event: PressEvent) => void;
  onPressEnd: () => void;
  onPress: () => void;
  onIntent: () => void;
  onUnmount: (focused: boolean) => void;
};

// The trigger before the menu chunk lands (./trigger-button), wired to request the
// chunk on hover / focus / press start and to remember the press.
const PlaceholderTrigger = ({ onIntent, onPressStart, onPressEnd, onPress, onUnmount }: PlaceholderProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  // USEEFFECT_JUSTIFICATION: reads DOM focus at the moment of the swap. A layout
  // effect's cleanup runs before React detaches the host node, so the focus is
  // still observable here (a removed node never gets a reliable blur).
  useLayoutEffect(() => {
    const button = ref.current;
    return () => onUnmount(button !== null && button === document.activeElement);
  }, [onUnmount]);

  return <MenuTriggerButton ref={ref} onHoverStart={onIntent} onFocus={onIntent} onPressStart={onPressStart} onPressEnd={onPressEnd} onPress={onPress} />;
};

const focusStrategyOf = (event: PressEvent): MenuHandoff['focusStrategy'] => {
  if (event.pointerType === 'keyboard' || event.pointerType === 'virtual') return 'first';
  return undefined;
};

// Mobile nav menu trigger (below 768px). Keeps the react-aria Menu UX, but only the
// trigger ships in the initial bundle. The chunk is requested in a transition, so the
// placeholder stays on screen (no fallback flash, no layout shift) until the menu can
// replace it; a press made while loading opens the menu as it lands — the first click
// / Enter / Space always works.
export const NavMenu = ({ pathname }: { pathname: string }) => {
  const [requested, setRequested] = useState(false);
  const handoff = useRef<MenuHandoff>(INITIAL_HANDOFF);

  const request = useCallback(() => {
    startTransition(() => setRequested(true));
  }, []);
  // Press start requests the chunk and marks the press as held; react-aria fires
  // onPressEnd before onPress, so a completed press reads open, a cancelled one
  // (dragged off) reads neither, and one still held at the swap reads pressing.
  const onPressStart = useCallback(
    (event: PressEvent) => {
      handoff.current = { ...handoff.current, pressing: true, focusStrategy: focusStrategyOf(event) };
      request();
    },
    [request],
  );
  const onPressEnd = useCallback(() => {
    handoff.current = { ...handoff.current, pressing: false };
  }, []);
  const onPress = useCallback(() => {
    handoff.current = { ...handoff.current, open: true };
  }, []);
  const onUnmount = useCallback((focused: boolean) => {
    handoff.current = { ...handoff.current, focused };
  }, []);

  const placeholder = <PlaceholderTrigger onIntent={request} onPressStart={onPressStart} onPressEnd={onPressEnd} onPress={onPress} onUnmount={onUnmount} />;

  return (
    <MenuBoundary fallback={placeholder}>
      <Suspense fallback={placeholder}>{requested ? <AriaNavMenu pathname={pathname} handoff={handoff} /> : placeholder}</Suspense>
    </MenuBoundary>
  );
};
