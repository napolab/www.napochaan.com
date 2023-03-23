import { action } from "@storybook/addon-actions";

import SwitchTheme from ".";

import type { SwitchThemeProps } from ".";
import type { Meta, Story } from "@storybook/react";

const meta: Meta<SwitchThemeProps> = {
  title: "components/SwitchTheme",
  component: SwitchTheme,
};

export default meta;

export const Default: Story<SwitchThemeProps> = (props) => {
  return <SwitchTheme {...props} onChange={action("change")} />;
};
Default.args = {
  defaultTheme: "light",
};
