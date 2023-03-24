// import ShowCase from "." の storybook を作成する

import { vars } from "@theme/css";

import ShowCase from ".";

import type { ShowCaseProps } from ".";
import type { Story, Meta } from "@storybook/react";



const meta: Meta = {
  title: "components/ShowCase",
  component: ShowCase,
};
export default meta;

const Template: Story<ShowCaseProps> = (args) => <ShowCase {...args} />;
export const Default = Template.bind({});
Default.args = {
  visibility: false,
  // key と ReactNode な children を持つ Item の配列を作成する
  items: Array.from({ length: 10 }, (_, idx) => ({
    key: idx,
    children: <div style={{ width: 200, height: 200, background: vars.pallets.accent2 }} />,
  })),
};
  
