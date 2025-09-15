"use client";
import { useMemo } from "react";
import { useMedia } from "use-media";

import { mediaQueries } from "@theme/css";

import type { ReactNode } from "react";

interface MediaQueryProviderProps {
  children: (size?: "sm" | "md" | "lg" | "xl") => ReactNode;
}

export const MediaQueryProvider = ({ children }: MediaQueryProviderProps) => {
  const isXL = useMedia(mediaQueries.xl);
  const isLG = useMedia(mediaQueries.lg);
  const isSM = useMedia(mediaQueries.sm);
  const isMD = useMedia(mediaQueries.md);

  const size = useMemo(() => {
    if (isXL) return "xl";
    if (isLG) return "lg";
    if (isMD) return "md";
    if (isSM) return "sm";

    return undefined;
  }, [isLG, isMD, isSM, isXL]);

  return <>{children(size)}</>;
};
