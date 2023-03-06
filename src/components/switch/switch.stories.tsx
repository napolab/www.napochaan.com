import { action } from "@storybook/addon-actions";

import Switch from "@components/switch";

import type { ComponentMeta, ComponentStory } from "@storybook/react";

const meta: ComponentMeta<typeof Switch> = {
  title: "components/switch",
  component: Switch,
  argTypes: {
    label: {
      type: "string",
    },
  },
};
export default meta;

export const Default: ComponentStory<typeof Switch> = (props) => {
  return <Switch {...props} onChange={action("change")} />;
};
Default.args = {
  "aria-label": "switch",
};
