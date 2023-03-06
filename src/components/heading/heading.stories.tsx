import Article from "@components/article";
import Heading from "@components/heading";
import Section from "@components/section";

import type { ComponentMeta, ComponentStory } from "@storybook/react";

const meta: ComponentMeta<typeof Heading> = {
  title: "components/Heading",
  component: Heading,
};
export default meta;

export const Default: ComponentStory<typeof Heading> = ({ children, ...props }) => {
  return (
    <Section>
      <Heading {...props}>{children} | Level1 </Heading>
      <Section>
        <Heading {...props}>{children} | Level2 </Heading>
        <Section>
          <Heading {...props}>{children} | Level3</Heading>
          <Section>
            <Heading {...props}>{children} | Level4</Heading>
            <Section>
              <Heading {...props}>{children} | Level5</Heading>
              <Section>
                <Heading {...props}>{children} | Level6</Heading>
              </Section>
            </Section>
          </Section>
        </Section>
      </Section>

      <Section>
        <Heading {...props}>{children} | Level2</Heading>
        <Article>
          <Heading {...props}>{children} | Level3</Heading>
        </Article>

        <Article>
          <Heading {...props}>{children} | Level3</Heading>
        </Article>
      </Section>
    </Section>
  );
};

Default.args = {
  children: "Heading",
};
