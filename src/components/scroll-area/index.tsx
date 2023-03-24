import { Corner, Root, Scrollbar, Thumb, Viewport } from "@radix-ui/react-scroll-area";
import { forwardRef, memo } from "react";

import * as styles from "./styles.css";

import type { ReactNode } from "react";

export type ScrollAreaProps = {
  orientation: "horizontal";
  children: ReactNode;
};

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(({ orientation, children }, ref) => {
  return (
    <Root ref={ref} className={styles.root}>
      <Viewport>
        <div className={styles.scrollArea}>{children}</div>
      </Viewport>

      <Scrollbar orientation={orientation} className={styles.scrollbar}>
        <Thumb className={styles.thumb} />
      </Scrollbar>
      <Corner />
    </Root>
  );
});

export default memo(ScrollArea);
