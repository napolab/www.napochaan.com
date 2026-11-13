// What the placeholder trigger hands the lazily loaded react-aria menu when it swaps
// in. Written by event handlers / the placeholder's unmount, read once by the menu's
// mount — a mutable ref, never render state.
export type MenuHandoff = {
  // The placeholder had focus when it was swapped out: the real trigger takes it over.
  focused: boolean;
  // A press completed on the placeholder: open as soon as the menu mounts.
  open: boolean;
  // A press is still held (down, not yet up) when the placeholder is swapped out. Its
  // release lands on the real trigger, which never saw the down and ignores it, so a
  // held press counts as an open too — react-aria opens a menu on press start anyway.
  pressing: boolean;
  // Initial menu focus for that open — 'first' after a keyboard / virtual (screen
  // reader) press, as react-aria does; undefined keeps react-aria's pointer default.
  focusStrategy: 'first' | undefined;
};

export const INITIAL_HANDOFF: MenuHandoff = { focused: false, open: false, pressing: false, focusStrategy: undefined };

// Whether the menu should open the moment it mounts.
export const shouldOpenOnMount = ({ open, pressing }: MenuHandoff): boolean => open || pressing;
