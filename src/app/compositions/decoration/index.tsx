import Animated from "./animated";
import * as styles from "./styles.css";

import type { FC } from "react";

type Props = {
  visible?: boolean;
};

const Decoration: FC<Props> = ({ visible }) => {
  return (
    <div className={styles.decorationRoot}>
      <div aria-hidden="true" className={styles.decoration1} />
      <div aria-hidden="true" className={styles.decoration2} />
      <Animated visible={visible} />
    </div>
  );
};

export default Decoration;
