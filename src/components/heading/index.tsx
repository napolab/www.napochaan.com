import { forwardRef, memo } from "react";

import { useHeadingLevel } from "@hooks/heading-level";

import * as styles from "./styles.css";

import type { DetailedHTMLProps, FC } from "react";

export type HeadingProps = Omit<
  DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
  "ref" | "className" | "style"
>;

const Heading: FC<HeadingProps> = forwardRef<HTMLHeadingElement, HeadingProps>(({ children, ...props }, ref) => {
  const level = useHeadingLevel();
  const type = `h${level ?? 6}` as const;
  const Component = type;

  if (level === null) throw new Error('The heading must be enclosed in a "section" or "article" element.');

  return (
    <Component className={styles.headingRoot[type]} ref={ref} {...props}>
      <span>{"#".repeat(level)}</span>
      <span>{children}</span>
    </Component>
  );
});

export default memo(Heading);
