import { createElement, forwardRef, memo, useMemo } from "react";

import { useHeadingLevel } from "@hooks/heading-level";

import * as styles from "./styles.css";

import type { DetailedHTMLProps, FC } from "react";

export type HeadingProps = Omit<
  DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
  "ref" | "className" | "style"
>;

const Heading: FC<HeadingProps> = forwardRef<HTMLHeadingElement, HeadingProps>(({ children, ...props }, ref) => {
  const level = useHeadingLevel();
  const _props = useMemo(() => ({ ...props, className: styles.container, ref }), [props, ref]);
  if (level === null) throw new Error('The heading must be enclosed in a "section" or "article" element.');

  return createElement(`h${level}`, _props, children);
});

export default memo(Heading);
