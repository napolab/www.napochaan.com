import { loadDefaultJapaneseParser } from "budoux";
import { forwardRef, Fragment, memo, useMemo } from "react";

import * as styles from "./styles.css";

import type { FC, ComponentPropsWithoutRef } from "react";

type Props = Omit<ComponentPropsWithoutRef<"span">, "children" | "className" | "style"> & {
  children: string;
};

const parser = loadDefaultJapaneseParser();
const Budoux = forwardRef<HTMLSpanElement, Props>(({ children, ...props }, ref) => {
  const texts = useMemo(
    () => (children.length > 0 ? parser.parse(children) : []).map((text, idx) => ({ text, key: `${text}_${idx}` })),
    [children],
  );

  return (
    <span {...props} ref={ref} className={styles.budouxRoot}>
      {texts.map(({ text, key }, idx) => (
        <Fragment key={key}>
          {text}
          {texts.length === idx - 1 ? null : <wbr />}
        </Fragment>
      ))}
    </span>
  );
}) satisfies FC<Props>;

export default memo(Budoux);
