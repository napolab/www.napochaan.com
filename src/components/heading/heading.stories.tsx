import Article from "@components/article";
import Heading from "@components/heading";
import Section from "@components/section";

import type { HeadingProps } from "@components/heading";
import type { Meta as ComponentMeta, Story as ComponentStory } from "@storybook/react";

const meta: ComponentMeta<HeadingProps> = {
  title: "components/Heading",
  component: Heading,
};
export default meta;

export const Default: ComponentStory<HeadingProps> = ({ children, ...props }) => {
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

export const Unstyled: ComponentStory<HeadingProps> = ({ children, ...props }) => {
  return (
    <Section style={{ padding: "1rem" }}>
      <Heading {...props} unstyled>
        {children}
      </Heading>
      <Section>
        <Heading {...props} unstyled>
          {children}
        </Heading>
        <Section>
          <Heading {...props} unstyled>
            {children}
          </Heading>
          <Section>
            <Heading {...props} unstyled>
              {children}
            </Heading>
            <Section>
              <Heading {...props} unstyled>
                {children}
              </Heading>
              <Section>
                <Heading {...props} unstyled>
                  {children}
                </Heading>
              </Section>
            </Section>
          </Section>
        </Section>
      </Section>

      <Section>
        <Heading {...props} unstyled>
          {children}
        </Heading>
        <Article>
          <Heading {...props} unstyled>
            {children}
          </Heading>
        </Article>

        <Article>
          <Heading {...props} unstyled>
            {children}
          </Heading>
        </Article>
      </Section>
    </Section>
  );
};

Unstyled.args = {
  children: "napochaan.com",
};
