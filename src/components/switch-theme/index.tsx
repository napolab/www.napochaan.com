import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { IconBrightnessUp, IconMoonStars } from "@tabler/icons-react";
import { forwardRef, memo, useCallback, useState } from "react";

import { useIsomorphicLayoutEffect } from "@hooks/isomorphic-effect";
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
    const [value, setValue] = useState<Theme | undefined>(defaultTheme);
    const handleValueChange = useCallback(
      (value: string) => {
        if (!isTheme(value)) return;

        setValue(value);
        onChange?.(value);
      },
      [onChange],
    );

    const [mounted, setMounted] = useState(false);
    useIsomorphicLayoutEffect(() => setMounted(true), []);

    if(!mounted) return null;

    return (
      <ToggleGroup.Root
        type="single"
        ref={ref}
        defaultValue={defaultTheme}
        value={theme ?? value}
        onValueChange={handleValueChange}
        orientation={orientation}
        loop
        className={styles.switchThemeRoot}
      >
        <ToggleGroup.Item value="light" aria-label="Light theme" className={styles.lightButton}>
          <IconBrightnessUp className={styles.icon} />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="dark" aria-label="Dark theme" className={styles.darkButton}>
          <IconMoonStars className={styles.icon} />
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    );
  },
);

export default memo(SwitchTheme);
