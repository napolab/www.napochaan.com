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
      {open ? children : null}
    </AnimatePresence>
  );
};