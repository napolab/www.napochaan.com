import { forwardRef, Fragment, memo } from "react";

import * as styles from "./styles.css";

type Props = {
  texts: string[];
};
const WrappedText = forwardRef<HTMLSpanElement, Props>(({ texts }, ref) => {
  return (
    <span className={styles.root} ref={ref}>
      {texts.map((text, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <Fragment key={`${text}__${idx}`}>
          {text}
          {texts.length === idx - 1 ? null : <wbr />}
        </Fragment>
      ))}
    </span>
  );
});

export default memo(WrappedText);
