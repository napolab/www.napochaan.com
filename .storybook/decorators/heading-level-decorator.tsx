import React from "react";
import { HeadingLevelProvider } from "../../src/hooks/heading-level";

export const headingLevelDecorator = (Story) => {
  return (
    <HeadingLevelProvider>
      <Story />
    </HeadingLevelProvider>
  );
};
