"use client";
import { motion, AnimatePresence } from "motion/react";

import type { ReactNode } from "react";

interface AnimatedDialogContentProps {
  open: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
}

export const AnimatedDialogContent = ({ open, size, children }: AnimatedDialogContentProps) => {
  const isSmall = size === "sm";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={
            isSmall
              ? { opacity: 1, x: 0, y: "100%", scale: 1 }
              : { opacity: 0.1, x: "-50%", y: "-25%" }
          }
          animate={
            isSmall
              ? { opacity: 1, x: 0, y: 0, scale: 1 }
              : { opacity: 1, x: "-50%", y: "-50%" }
          }
          exit={
            isSmall
              ? { opacity: 1, x: 0, y: "100%", scale: 1 }
              : { opacity: 0, x: "-50%", y: "-25%" }
          }
          transition={
            isSmall
              ? { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
              : { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
          }
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};