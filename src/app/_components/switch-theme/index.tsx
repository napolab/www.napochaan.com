"use client";
import { animated, useScroll, useSpring } from "@react-spring/web";
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
  const { scrollYProgress } = useScroll();
  const isXL = useMedia(mediaQueries.xl);
  const themeSwitchAnim = useSpring({
    transform: scrollYProgress.to((v) => (v > 0.8 && !isXL ? "translateY(100%)" : "translateY(0%)")),
    bottom: scrollYProgress.to((v) => (v > 0.8 && !isXL ? "0rem" : "0.5rem")),
  });

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
    <animated.div className={styles.switchTheme} style={themeSwitchAnim}>
      <Switch theme={isTheme(theme) ? theme : undefined} defaultTheme="dark" onChange={setTheme} />
    </animated.div>
  );
};
