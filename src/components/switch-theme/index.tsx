import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { IconBrightnessUp, IconMoonStars } from "@tabler/icons-react";
import { forwardRef, memo, useCallback, useState } from "react";

import { isTheme } from "@theme";

import * as styles from "./styles.css";

import type { Theme } from "@theme";

export type SwitchThemeProps = {
  theme?: Theme;
  defaultTheme?: Theme;
  onChange?: (theme: Theme) => void;
  orientation?: "horizontal" | "vertical";
};

const SwitchTheme = forwardRef<HTMLDivElement, SwitchThemeProps>(
  ({ theme, defaultTheme, onChange, orientation }, ref) => {
    const [_value, setValue] = useState<Theme | undefined>(defaultTheme);
    const value = theme ?? _value;
    const handleValueChange = useCallback(
      (value: string) => {
        if (!isTheme(value)) return;

        setValue(value);
        onChange?.(value);
      },
      [onChange],
    );

    return (
      <ToggleGroup.Root
        type="single"
        ref={ref}
        defaultValue={defaultTheme}
        value={value}
        onValueChange={handleValueChange}
        orientation={orientation}
        loop
        className={styles.switchThemeRoot}
      >
        <ToggleGroup.Item
          value="light"
          aria-label="Light theme"
          className={styles.lightButton[value === "light" ? "checked" : "default"]}
        >
          <IconBrightnessUp className={styles.icon} />
        </ToggleGroup.Item>
        <ToggleGroup.Item
          value="dark"
          aria-label="Dark theme"
          className={styles.darkButton[value === "dark" ? "checked" : "default"]}
        >
          <IconMoonStars className={styles.icon} />
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    );
  },
);

export default memo(SwitchTheme);
