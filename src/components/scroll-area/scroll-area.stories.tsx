import { calc } from "@vanilla-extract/css-utils";

import { vars } from "@theme/css";

import ScrollArea from ".";

import type { ScrollAreaProps } from ".";
import type { Meta, Story } from "@storybook/react";

const meta: Meta<ScrollAreaProps> = {
  title: "components/ScrollArea",
  component: ScrollArea,
};

export default meta;

export const Horizontal: Story<ScrollAreaProps> = () => {
  return (
    <div style={{ width: 500 }}>
      <ScrollArea orientation="horizontal">
        <div style={{ display: "flex", gap: vars.space.md }}>
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
        </div>
      </ScrollArea>
    </div>
  );
};


export const Vertical: Story<ScrollAreaProps> = () => {
  return (
    <div style={{ height: 500, width: calc.add("160px", calc.multiply(vars.space.sm, 2)) }}>
      <ScrollArea orientation="vertical">
        <div style={{ display: "flex", flexDirection: "column", gap: vars.space.md }}>
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
          <div style={{ width: 160, height: 160, background: vars.pallets.text.main }} />
        </div>
      </ScrollArea>
    </div>
  );
};