"use client";
import { forwardRef, memo } from "react";

import { useHeadingLevel } from "@hooks/heading-level";
import { clsx } from "@utils/clsx";

import * as styles from "./styles.css";

import type { DetailedHTMLProps, FC } from "react";

export type HeadingProps = Omit<
  DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
  "ref" | "style"
> & {
  unstyled?: boolean;
};

const Heading: FC<HeadingProps> = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, className, unstyled = false, ...props }, ref) => {
    const level = useHeadingLevel();
    const type = `h${level ?? 6}` as const;
    const Component = type;

    if (level === null) throw new Error('The heading must be enclosed in a "section" or "article" element.');

    if (unstyled) {
      return (
        <Component ref={ref} {...props} className={className}>
          {children}
        </Component>
      );
    }

    return (
      <Component className={clsx(styles.heading[type], className)} ref={ref} {...props}>
        <span>{"#".repeat(level)}</span>
        <span>{children}</span>
      </Component>
    );
  },
);

export default memo(Heading);
