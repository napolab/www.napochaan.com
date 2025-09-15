"use client";
import { motion } from "motion/react";

import * as styles from "./styles.css";

import type { ReactNode } from "react";

type DecorationImageProps = {
  contactInView: boolean;
  children: ReactNode;
};

export const DecorationImage = ({ contactInView, children }: DecorationImageProps) => {
  return (
    <motion.div
      className={styles.decorationImageRoot}
      aria-hidden="true"
      initial={{ x: "125%" }}
      animate={{ x: contactInView ? "0%" : "125%" }}
      transition={{
        type: "spring",
        damping: 14,
        stiffness: 120,
        delay: 0.8,
      }}
    >
      {children}
    </motion.div>
  );
};
