import { useEffect, useLayoutEffect } from "react";

const isSSR = typeof window === "undefined";

export const useIsomorphicLayoutEffect = isSSR ? useEffect : useLayoutEffect;
