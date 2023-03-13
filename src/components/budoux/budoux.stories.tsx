import { useRef } from "react";

import Article from "@components/article";
import Budoux from "@components/budoux";
import Heading from "@components/heading";
import Section from "@components/section";
import { useResizeObserver } from "@hooks/resize-observer";

import * as styles from "./styles.css";

import type { ComponentMeta, ComponentStory } from "@storybook/react";

const meta: ComponentMeta<typeof Budoux> = {
  title: "components/Budoux",
  component: Budoux,
  argTypes: {
    children: {
      type: "string",
    },
  },
};

export default meta;

export const Default: ComponentStory<typeof Budoux> = (props) => {
  const ref1 = useRef<HTMLDivElement>(null);
  const resize1 = useResizeObserver(ref1);

  const ref2 = useRef<HTMLDivElement>(null);
  const resize2 = useResizeObserver(ref2);

  return (
    <Section style={{ padding: "1rem" }}>
      <Heading>Budoux vs Paragraph</Heading>
      <Article style={{ marginBottom: "2rem" }}>
        <Heading>Budoux</Heading>
        <div
          style={{ overflow: "hidden", resize: "horizontal", width: resize2?.contentRect.width ?? "100%" }}
          ref={ref1}
        >
          <Budoux {...props}></Budoux>
        </div>
      </Article>

      <Article>
        <Heading>Paragraph</Heading>
        <div
          style={{ overflow: "hidden", resize: "horizontal", width: resize1?.contentRect.width ?? "100%" }}
          ref={ref2}
        >
          <p className={styles.budouxRoot}>{props.children}</p>
        </div>
      </Article>
    </Section>
  );
};

Default.args = {
  children: `吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。吾輩はここで始めて人間というものを見た。しかもあとで聞くとそれは書生という人間中で一番獰悪な種族であったそうだ。この書生というのは時々我々を捕えて煮て食うという話である。しかしその当時は何という考もなかったから別段恐しいとも思わなかった。ただ彼の掌に載せられてスーと持ち上げられた時何だかフワフワした感じがあったばかりである。掌の上で少し落ちついて書生の顔を見たのがいわゆる人間というものの見始であろう。この時妙なものだと思った感じが今でも残っている。第一毛をもって装飾されべきはずの顔がつるつるしてまるで薬缶だ。その後猫にもだいぶ逢ったがこんな片輪には一度も出会わした事がない。のみならず顔の真中があまりに突起している。そうしてその穴の中から時々ぷうぷうと煙を`,
};
