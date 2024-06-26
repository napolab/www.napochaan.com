"use client";
import { Root, Item } from "@radix-ui/react-toggle-group";
import { animated, config, useSpring } from "@react-spring/web";
import { IconBrightnessUp, IconMoonStars } from "@tabler/icons-react";
import { forwardRef, memo, useCallback, useEffect, useState } from "react";

import { isTheme } from "@theme";
import { usePalette } from "@theme/provider";

import * as styles from "./styles.css";

import type { Theme } from "@theme";

type Props = {
  theme?: Theme;
  defaultTheme?: Theme;
  onChange?: (theme: Theme) => void;
  orientation?: "horizontal";
};

const SwitchTheme = forwardRef<HTMLDivElement, Props>(({ theme, defaultTheme, onChange, orientation }, ref) => {
  const palettes = usePalette();

  const [_value, setValue] = useState<Theme | undefined>(defaultTheme);
  const value = theme ?? _value;
  const [forceKey, updateForceKey] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => {
      updateForceKey(Date.now());
    }, 100);

    return () => {
      clearTimeout(id);
    };
  }, []);

  const handleValueChange = useCallback(
    (value: string) => {
      if (!isTheme(value)) return;

      setValue(value);
      onChange?.(value);
    },
    [onChange],
  );

  const lightButtonAnim = useSpring({
    from: { transform: "scale(0)", background: "transparent" },
    transform: value === "light" ? "scale(1)" : "scale(0)",
    background: value === "light" ? palettes.accent1 : "transparent",
    config: config.gentle,
  });
  const lightIconAnim = useSpring({
    from: { color: palettes.disabled },
    color: value === "light" ? palettes.black : palettes.disabled,
    config: config.gentle,
  });
  const darkButtonAnim = useSpring({
    from: { transform: "scale(0)", background: "transparent" },
    transform: value === "dark" ? "scale(1)" : "scale(0)",
    background: value === "dark" ? palettes.black : "transparent",
    config: config.gentle,
  });
  const darkIconAnim = useSpring({
    from: { color: palettes.disabled },
    get color() {
      return value === "dark" ? palettes.accent1 : palettes.disabled;
    },
    config: config.gentle,
  });

  return (
    <Root
      type="single"
      ref={ref}
      defaultValue={defaultTheme}
      value={value}
      onValueChange={handleValueChange}
      orientation={orientation}
      loop
      className={styles.switchThemeRoot}
      key={forceKey}
    >
      <animated.div className={styles.thumb.light} style={lightButtonAnim} />
      <animated.div className={styles.thumb.dark} style={darkButtonAnim} />

      <animated.div style={lightIconAnim}>
        <Item value="light" aria-label="Light theme" className={styles.button}>
          <IconBrightnessUp className={styles.icon} />
        </Item>
      </animated.div>
      <animated.div style={darkIconAnim}>
        <Item value="dark" aria-label="Dark theme" className={styles.button}>
          <IconMoonStars className={styles.icon} />
        </Item>
      </animated.div>
    </Root>
  );
});

export default memo(SwitchTheme);
