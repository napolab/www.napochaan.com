import Link from "next/link";

import Heading from "@components/heading";
import Section from "@components/section";

import { AnimatedWorksRoot } from "./animated-works-wrapper";
import { InViewSection } from "./in-view-section";
import * as styles from "./styles.css";

import type { ShowCaseItem } from "@components/show-case";

type Props = {
  histories: ShowCaseItem[];
  libraries: ShowCaseItem[];
  articles: ShowCaseItem[];
};

export const Works = ({ histories, libraries, articles }: Props) => {
  return (
    <AnimatedWorksRoot>
      <Section id="works" className={styles.worksSection}>
        <div>
          <Link href="#works" scroll className={styles.anchorLink}>
            <Heading translate="no">Works</Heading>
          </Link>
        </div>

        <InViewSection
          id="histories"
          title="History"
          items={histories}
          className={styles.section3}
        />

        <InViewSection
          id="article"
          title="Article"
          items={articles}
          className={styles.section3}
        />

        <InViewSection
          id="library"
          title="Library"
          items={libraries}
          className={styles.section3}
        />
      </Section>
    </AnimatedWorksRoot>
  );
};
