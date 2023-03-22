import ScrollArea from ".";

import type { ScrollAreaProps } from ".";
import type { Meta, Story } from "@storybook/react";

const meta: Meta<ScrollAreaProps> = {
  title: "components/ScrollArea",
  component: ScrollArea,
};

export default meta;

export const Default: Story<ScrollAreaProps> = () => {
  return (
    <div style={{ maxWidth: 500 }}>
      <ScrollArea orientation="horizontal">
        <div style={{ width: 160, height: 160, background: "red" }}></div>
        <div style={{ width: 160, height: 160, background: "red" }}></div>
        <div style={{ width: 160, height: 160, background: "red" }}></div>
        <div style={{ width: 160, height: 160, background: "red" }}></div>
        <div style={{ width: 160, height: 160, background: "red" }}></div>
      </ScrollArea>
    </div>
  );
};