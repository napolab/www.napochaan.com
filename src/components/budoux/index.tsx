import { loadDefaultJapaneseParser } from "budoux";
import { forwardRef, Fragment, memo, useMemo } from "react";

import * as styles from "./styles.css";

import type { FC, ComponentPropsWithoutRef } from "react";

export type BudouxProps = Omit<ComponentPropsWithoutRef<"span">, "children" | "className" | "style"> & {
  children: string;
};

const parser = loadDefaultJapaneseParser();
const Budoux = forwardRef<HTMLSpanElement, BudouxProps>(({ children, ...props }, ref) => {
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
}) satisfies FC<BudouxProps>;

export default memo(Budoux);
