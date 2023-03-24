import WrappedText from ".";

import type { WrappedTextProps } from ".";
import type { Meta, Story } from "@storybook/react";

const meta: Meta = {
  title: "components/WrappedText",
  component: WrappedText,
};

export default meta;

const Template: Story<WrappedTextProps> = (args) => (
  <div style={{ resize: "horizontal", overflow: "scroll", maxWidth: 300, padding: 16 }}>
    <WrappedText {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  texts: ["Hello", "World!"],
};
