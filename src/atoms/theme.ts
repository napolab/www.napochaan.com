import { atomWithStorage } from "jotai/utils";

import type { Theme } from "@theme";

export const themeAtom = atomWithStorage<Theme | undefined>("theme", undefined);
