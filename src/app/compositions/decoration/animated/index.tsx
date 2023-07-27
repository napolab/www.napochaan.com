"use client";

import { animated, config, useSpring } from "@react-spring/web";
import { memo } from "react";

import * as styles from "./styles.css";

import type { FC } from "react";

type Props = {
  visible?: boolean;
};
const Animated: FC<Props> = ({ visible }) => {
  const decorationImageAnim = useSpring({
    from: {
      transform: `translateX(125%)`,
    },
    to: {
      transform: visible ? "translateX(0%)" : `translateX(125%)`,
    },
    config: config.gentle,
    delay: 800,
  });

  return (
    <animated.div className={styles.decorationImageRoot} aria-hidden="true" style={decorationImageAnim}>
      <img
        className={styles.decorationImage}
        decoding="async"
        src="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/800x800"
        alt="naporitan のオリジナルキャラクター"
        width={800}
        height={800}
        loading="lazy"
      />
    </animated.div>
  );
};

/** @package */
export default memo(Animated);
