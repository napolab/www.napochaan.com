import { memo, forwardRef } from "react";

import * as styles from "./styles.css";

import type { FC, ComponentPropsWithoutRef } from "react";

type Props = Omit<ComponentPropsWithoutRef<"span">, "children" | "className" | "style"> & {
  children: string;
};

const Fallback = forwardRef<HTMLSpanElement, Props>(({ children, ...props }, ref) => (
  <span {...props} ref={ref} className={styles.fallbackRoot}>
    {children}
  </span>
)) satisfies FC<Props>;

export default memo(Fallback);
