import SquareImage from "@components/square-image";

import type { ComponentMeta, ComponentStory } from "@storybook/react";

const meta: ComponentMeta<typeof SquareImage> = {
  title: "components/SquareImage",
  component: SquareImage,
};

export default meta;

export const Default: ComponentStory<typeof SquareImage> = (props) => {
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <SquareImage {...props} />
      <SquareImage
        {...props}
        src="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/5ca1e2d1-41bd-4ce8-c903-3af938fc8c00/square"
        caption="クール系の naporitan"
      />
      <SquareImage
        {...props}
        src="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c161150a-80cb-4783-4bda-870c85e5de00/square"
        caption="かわいい系の naporitan"
      />
    </div>
  );
};

Default.args = {
  src: "http://placekitten.com/200/300",
  caption: "かわいい猫の画像",
};
