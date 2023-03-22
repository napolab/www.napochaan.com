import { forwardRef, memo } from "react";

import { useHeadingLevel, HeadingLevelProvider, isHeadingLevel } from "@hooks/heading-level";

import type { ComponentPropsWithoutRef } from "react";

const Article = forwardRef<HTMLElement, ComponentPropsWithoutRef<"article">>((props, ref) => {
  const level = useHeadingLevel();
  const nextLevel = Math.min((level ?? 0) + 1, 6);

  return (
    <HeadingLevelProvider level={isHeadingLevel(nextLevel) ? nextLevel : undefined}>
      <article {...props} ref={ref} />
    </HeadingLevelProvider>
  );
});

export default memo(Article);
