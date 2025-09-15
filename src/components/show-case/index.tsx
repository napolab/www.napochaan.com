import { forwardRef, memo } from "react";

import ScrollArea from "@components/scroll-area";

import { AnimatedShowCaseItems } from "./_components/animated-show-case-items";
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
  return (
    <ScrollArea orientation="horizontal" ref={ref}>
      <div className={styles.scrollArea}>
        <AnimatedShowCaseItems visibility={visibility} items={items} />
      </div>
    </ScrollArea>
  );
}) satisfies FC<Props>;

export default memo(ShowCase);
