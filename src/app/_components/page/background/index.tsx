"use client";
import { animated, config, useSpring } from "@react-spring/web";
import { useSyncExternalStore } from "react";

import keyVisualImage from "@assets/napochaan.webp";
import Image from "@components/image";

// eslint-disable-next-line no-restricted-imports
import * as source from "../source";

import * as styles from "./styles.css";

export const Background = () => {
  const contactInView = useSyncExternalStore(
    (onStoreChange) => source.contactInView.subscribe(onStoreChange),
    () => source.contactInView.getState(),
    () => false,
  );
  const decorationImageAnim = useSpring({
    from: { transform: `translateX(125%)` },
    to: { transform: contactInView ? "translateX(0%)" : `translateX(125%)` },
    config: config.gentle,
    delay: 800,
  });

  return (
    <div className={styles.decorationRoot}>
      <div aria-hidden="true" className={styles.decoration1} />
      <div aria-hidden="true" className={styles.decoration2} />
      <animated.div className={styles.decorationImageRoot} aria-hidden="true" style={decorationImageAnim}>
        <Image
          className={styles.decorationImage}
          src={keyVisualImage}
          alt="naporitan のオリジナルキャラクター"
          width={600}
          height={600}
        />
      </animated.div>
    </div>
  );
};
