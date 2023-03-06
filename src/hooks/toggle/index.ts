import { useCallback, useState } from "react";

type ToggleHook = [
  state: boolean,
  toggle: () => void,
  setter: ((state: boolean) => void) | ((dispatch: (state: boolean) => boolean) => void),
];
export const useToggle = (value = false): ToggleHook => {
  const [state, setState] = useState(value);
  const toggle = useCallback(() => setState((b) => !b), []);

  return [state, toggle, setState];
};
