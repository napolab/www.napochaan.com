"use client";
import { motion } from "motion/react";
import { Children } from "react";

import * as styles from "./styles.css";

import type { Theme } from "@theme";
import type { Palettes } from "@theme/config/base.css";
import type { ReactElement } from "react";

interface AnimatedSwitchThemeElementsProps {
  value?: Theme;
  palettes: Palettes;
  children: [ReactElement, ReactElement]; // Light and Dark items
}

export const AnimatedSwitchThemeElements = ({ value, palettes, children }: AnimatedSwitchThemeElementsProps) => {
  const [lightItem, darkItem] = Children.toArray(children);

  return (
    <>
      <motion.div
        className={styles.thumb.light}
        initial={{ scale: 0, backgroundColor: "transparent" }}
        animate={{
          scale: value === "light" ? 1 : 0,
          backgroundColor: value === "light" ? palettes.accent1 : "transparent",
        }}
        transition={{ type: "spring", damping: 14, stiffness: 120 }}
      />
      <motion.div
        className={styles.thumb.dark}
        initial={{ scale: 0, backgroundColor: "transparent" }}
        animate={{
          scale: value === "dark" ? 1 : 0,
          backgroundColor: value === "dark" ? palettes.black : "transparent",
        }}
        transition={{ type: "spring", damping: 14, stiffness: 120 }}
      />

      <motion.div
        initial={{ color: palettes.disabled }}
        animate={{
          color: value === "light" ? palettes.black : palettes.disabled,
        }}
        transition={{ type: "spring", damping: 14, stiffness: 120 }}
      >
        {lightItem}
      </motion.div>
      <motion.div
        initial={{ color: palettes.disabled }}
        animate={{
          color: value === "dark" ? palettes.accent1 : palettes.disabled,
        }}
        transition={{ type: "spring", damping: 14, stiffness: 120 }}
      >
        {darkItem}
      </motion.div>
    </>
  );
};
