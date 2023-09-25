"use client";
import { forwardRef, memo } from "react";

import { useHeadingLevel, HeadingLevelProvider, isHeadingLevel } from "@hooks/heading-level";

import type { ComponentPropsWithoutRef, FC } from "react";

const Section = forwardRef<HTMLElement, ComponentPropsWithoutRef<"section">>((props, ref) => {
  const level = useHeadingLevel();
  const nextLevel = Math.min((level ?? 0) + 1, 6);

  return (
    <HeadingLevelProvider level={isHeadingLevel(nextLevel) ? nextLevel : undefined}>
      <section {...props} ref={ref} />
    </HeadingLevelProvider>
  );
}) satisfies FC<ComponentPropsWithoutRef<"section">>;

export default memo(Section);
