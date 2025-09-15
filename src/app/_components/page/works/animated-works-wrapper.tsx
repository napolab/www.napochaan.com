"use client";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import * as styles from "./styles.css";

import type { ReactNode } from "react";

interface AnimatedWorksRootProps {
  children: ReactNode;
}

export const AnimatedWorksRoot = ({ children }: AnimatedWorksRootProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-30% 0%" });

  return (
    <motion.div
      ref={ref}
      className={styles.worksRoot}
      initial={{ opacity: 0, y: "0.5rem" }}
      animate={{
        opacity: isInView ? 1 : 0,
        y: isInView ? "0rem" : "0.5rem"
      }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
};