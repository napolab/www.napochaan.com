import SquareImage from "@components/square-image";

import type { SquareImageProps } from "@components/square-image";
import type { Meta as ComponentMeta, Story as ComponentStory } from "@storybook/react";

const meta: ComponentMeta<SquareImageProps> = {
  title: "components/SquareImage",
  component: SquareImage,
};

export default meta;

export const Default: ComponentStory<SquareImageProps> = (props) => {
  return (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
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
  src: "https://lgtm.napochaan.com",
  caption: "かわいい猫の LGTM 画像",
};
