import { forwardRef, Fragment, memo } from "react";

import * as styles from "./styles.css";

export type WrappedTextProps = {
  texts: string[];
};
const WrappedText = forwardRef<HTMLSpanElement, WrappedTextProps>(({ texts }, ref) => {
  return (
    <span className={styles.root} ref={ref}>
      {texts.map((text, idx) => (
        <Fragment key={`${text}__${idx}`}>
          {text}
          {texts.length === idx - 1 ? null : <wbr />}
        </Fragment>
      ))}
    </span>
  );
});

export default memo(WrappedText);
