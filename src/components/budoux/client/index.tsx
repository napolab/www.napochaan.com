"use client";
import { loadDefaultJapaneseParser } from "budoux";
import { Fragment, memo, useMemo, forwardRef } from "react";

import * as styles from "./styles.css";

import type { FC, ComponentPropsWithoutRef } from "react";

type Props = Omit<ComponentPropsWithoutRef<"span">, "children" | "className" | "style"> & {
  children: string;
};

type ParsedText = {
  text: string;
  key: string;
};

const Client = forwardRef<HTMLSpanElement, Props>(({ children, ...props }, ref) => {
  const parsedTexts = useMemo<ParsedText[]>(() => {
    if (children.length === 0) return [];

    try {
      const parser = loadDefaultJapaneseParser();

      return parser.parse(children).map(
        (text: string, idx: number): ParsedText => ({
          text,
          key: `${text}_${idx}`,
        }),
      );
    } catch {
      return [];
    }
  }, [children]);

  const hasValidTexts = parsedTexts.length > 0;

  return (
    <span {...props} ref={ref} className={styles.clientRoot}>
      {hasValidTexts
        ? parsedTexts.map(({ text, key }, idx) => (
            <Fragment key={key}>
              {text}
              {idx < parsedTexts.length - 1 && <wbr />}
            </Fragment>
          ))
        : children}
    </span>
  );
}) satisfies FC<Props>;

export default memo(Client);
