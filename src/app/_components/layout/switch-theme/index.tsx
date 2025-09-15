"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useReducer } from "react";
import { useMedia } from "use-media";

import Switch from "@components/switch-theme";
import { isTheme } from "@theme";
import { mediaQueries } from "@theme/utils";

import * as styles from "./styles.css";

export const SwitchTheme = () => {
  const [, force] = useReducer((c) => c + 1, 0);
  const { theme, setTheme } = useTheme();
  const isXL = useMedia(mediaQueries.xl);
  const { scrollYProgress } = useScroll();
  const translateY = useTransform(scrollYProgress, [0.8, 1], ["0%", "100%"]);
  const bottom = useTransform(scrollYProgress, [0.8, 1], ["0.5rem", "0rem"]);

  useEffect(() => {
    // なんか動かないので適当に rerendering する
    const id = setTimeout(() => {
      force();
    }, 100);

    return () => {
      clearTimeout(id);
    };
  }, []);

  return (
    <motion.div
      className={styles.switchTheme}
      style={{ translateY: isXL ? "0%" : translateY, bottom: isXL ? "0.5rem" : bottom }}
    >
      <Switch theme={isTheme(theme) ? theme : undefined} defaultTheme="dark" onChange={setTheme} />
    </motion.div>
  );
};
