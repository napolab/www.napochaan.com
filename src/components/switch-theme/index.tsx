import { Root, Item } from "@radix-ui/react-toggle-group";
import { IconBrightnessUp, IconMoonStars } from "@tabler/icons-react";
import { forwardRef, memo, useCallback, useEffect, useState } from "react";

import { isTheme } from "@theme";
import { usePalette } from "@theme/provider";

import { AnimatedSwitchThemeElements } from "./_components/animated-switch-theme-elements";
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
      <AnimatedSwitchThemeElements value={value} palettes={palettes}>
        <Item value="light" aria-label="Light theme" className={styles.button}>
          <IconBrightnessUp className={styles.icon} />
        </Item>
        <Item value="dark" aria-label="Dark theme" className={styles.button}>
          <IconMoonStars className={styles.icon} />
        </Item>
      </AnimatedSwitchThemeElements>
    </Root>
  );
});

export default memo(SwitchTheme);
