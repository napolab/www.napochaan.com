"use client";
import { useTrail, animated, config } from "@react-spring/web";
import { forwardRef, memo } from "react";

import ScrollArea from "@components/scroll-area";

import * as styles from "./styles.css";

import type { Key, ReactNode, FC } from "react";

export type ShowCaseItem = {
  key: Key;
  children: ReactNode;
};
type Props = {
  visibility?: boolean;
  items: ShowCaseItem[];
};
const ShowCase = forwardRef<HTMLDivElement, Props>(({ visibility = false, items }, ref) => {
  const trails = useTrail(items.length, {
    from: { opacity: 0, transform: "scale(0.8)" },
    opacity: visibility ? 1 : 0,
    transform: visibility ? "scale(1)" : "scale(0.8)",
    config: config.stiff,
  });

  return (
    <ScrollArea orientation="horizontal" ref={ref}>
      <div className={styles.scrollArea}>
        {trails.map((style, idx) => (
          <animated.div style={style} key={items[idx].key}>
            {items[idx].children}
          </animated.div>
        ))}
      </div>
    </ScrollArea>
  );
}) satisfies FC<Props>;

export default memo(ShowCase);
