"use client";
import { Corner, Root, Scrollbar, Thumb, Viewport } from "@radix-ui/react-scroll-area";
import { forwardRef, memo } from "react";

import * as styles from "./styles.css";

import type { ReactNode } from "react";

type Props = {
  orientation: "horizontal" | "vertical";
  children: ReactNode;
  scrollbar?: "hover" | "all";
};

const ScrollArea = forwardRef<HTMLDivElement, Props>(({ orientation, children, scrollbar }, ref) => {
  return (
    <Root ref={ref} className={styles.root[orientation]}>
      <Viewport className={styles.viewport}>{children}</Viewport>

      <Scrollbar
        orientation={orientation}
        className={styles.scrollbar[orientation]}
        forceMount={scrollbar === "all" ? true : undefined}
      >
        <Thumb className={styles.thumb} />
      </Scrollbar>
      <Corner />
    </Root>
  );
});

export default memo(ScrollArea);
