"use client";
import { AnimatePresence } from "motion/react";

import type { ReactNode } from "react";

type Props = { open: boolean; size?: "sm" | "md" | "lg" | "xl"; children: ReactNode };

export const AnimatedDialogContent = ({ open, children }: Props) => {
  return <AnimatePresence>{open ? children : null}</AnimatePresence>;
};
