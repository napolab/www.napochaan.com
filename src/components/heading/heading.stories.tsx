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
    <Section style={{ padding: "1rem" }}>
      <Heading {...props}>{children}</Heading>
      <Section>
        <Heading {...props}>{children}</Heading>
        <Section>
          <Heading {...props}>{children}</Heading>
          <Section>
            <Heading {...props}>{children}</Heading>
            <Section>
              <Heading {...props}>{children}</Heading>
              <Section>
                <Heading {...props}>{children}</Heading>
              </Section>
            </Section>
          </Section>
        </Section>
      </Section>

      <Section>
        <Heading {...props}>{children}</Heading>
        <Article>
          <Heading {...props}>{children}</Heading>
        </Article>

        <Article>
          <Heading {...props}>{children}</Heading>
        </Article>
      </Section>
    </Section>
  );
};

Default.args = {
  children: "napochaan.com",
};
