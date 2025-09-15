"use client";
import { motion } from "motion/react";

import * as styles from "./styles.css";

import type { ReactNode } from "react";

interface AnimatedDecorationImageProps {
  contactInView: boolean;
  children: ReactNode;
}

export const AnimatedDecorationImage = ({ contactInView, children }: AnimatedDecorationImageProps) => {
  return (
    <motion.div
      className={styles.decorationImageRoot}
      aria-hidden="true"
      initial={{ x: "125%" }}
      animate={{ x: contactInView ? "0%" : "125%" }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94], // Similar to config.gentle
        delay: 0.8,
      }}
    >
      {children}
    </motion.div>
  );
};
