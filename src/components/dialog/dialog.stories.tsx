// import Dialog from "." の storybook を作成する

import { DialogContent, DialogRoot, DialogTrigger } from ".";

import type { DialogContentProps } from ".";
import type { Story, Meta } from "@storybook/react";

const meta: Meta = {
  title: "components/Dialog",
  component: DialogContent,
  argTypes: {
    title: {
      type: "string",
    },
    description: {
      type: "string",
    },
    open: {
      control: {
        type: "boolean",
      },
    },
  },
};
export default meta;

type StoryProps = DialogContentProps & {
  open?: boolean;
};

const Template: Story<StoryProps> = ({ open, ...props }) => {
  return (
    <DialogRoot open={open}>
      <DialogTrigger asChild>
        <button>open</button>
      </DialogTrigger>

      <DialogContent {...props} title={props.title ?? "ダイアログ"}>
        <p>これはダイアログです。</p>

        <div>
          <button>ok</button>
          <button>cancel</button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};

export const Default = Template.bind({});
Default.args = {
  title: "ダイアログ",
};
export const Open = Template.bind({});
Open.args = {
  open: true,
};
