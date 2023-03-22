import SquareImage from "@components/square-image";

import type { SquareImageProps } from "@components/square-image";
import type { Meta as ComponentMeta, Story as ComponentStory } from "@storybook/react";

const meta: ComponentMeta<SquareImageProps> = {
  title: "components/SquareImage",
  component: SquareImage,
  argTypes: {
    caption: {
      type: "string",
    },
  },
};

export default meta;

export const Default: ComponentStory<SquareImageProps> = (props) => {
  return (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <SquareImage {...props} />
      <SquareImage
        {...props}
        src="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/6305471d-3774-4bc1-09c8-1e7ed3c40100/800x800"
        caption="クール系の naporitan"
      />
      <SquareImage
        {...props}
        src="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/800x800"
        caption="かわいい系の naporitan"
      />
    </div>
  );
};

Default.args = {
  src: "https://lgtm.napochaan.com",
  caption: "かわいい猫の LGTM 画像",
};
