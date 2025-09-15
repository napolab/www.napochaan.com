"use client";
import { motion, useInView } from "motion/react";
import { useRef, useEffect } from "react";

import * as source from "../source";

import * as styles from "./styles.css";

import type { ReactNode } from "react";

interface AnimatedContactRootProps {
  children: ReactNode;
}

export const AnimatedContactRoot = ({ children }: AnimatedContactRootProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0%" });

  useEffect(() => {
    source.contactInView.next(isInView);
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      className={styles.contactRoot}
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