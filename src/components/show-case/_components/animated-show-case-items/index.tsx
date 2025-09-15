"use client";
import { motion } from "motion/react";

import type { ShowCaseItem } from "../../index";

interface AnimatedShowCaseItemsProps {
  visibility: boolean;
  items: ShowCaseItem[];
}

export const AnimatedShowCaseItems = ({ visibility, items }: AnimatedShowCaseItemsProps) => {
  return (
    <>
      {items.map((item, idx) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: visibility ? 1 : 0,
            scale: visibility ? 1 : 0.8,
          }}
          transition={{
            duration: 0.4,
            delay: idx * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {item.children}
        </motion.div>
      ))}
    </>
  );
};
