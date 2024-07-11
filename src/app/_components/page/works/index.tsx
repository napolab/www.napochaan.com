"use client";
import { animated, useInView, useSpring } from "@react-spring/web";
import Link from "next/link";

import Heading from "@components/heading";
import Section from "@components/section";
import ShowCase from "@components/show-case";

import * as styles from "./styles.css";

import type { ShowCaseItem } from "@components/show-case";

type Props = {
  histories: ShowCaseItem[];
  libraries: ShowCaseItem[];
  articles: ShowCaseItem[];
};

export const Works = ({ histories, libraries, articles }: Props) => {
  const [worksRef, worksInView] = useInView({ once: true, rootMargin: "-30% 0%" });
  const worksAnim = useSpring({
    opacity: worksInView ? 1 : 0,
    transform: worksInView ? "translateY(0rem)" : "translateY(0.5rem)",
  });

  const [historyRef, historyInView] = useInView({ once: true });
  const [articleRef, articleInView] = useInView({ once: true });
  const [libraryRef, libraryInView] = useInView({ once: true });

  return (
    <animated.div ref={worksRef} className={styles.worksWrapper} style={worksAnim}>
      <Section id="works" className={styles.worksRoot}>
        <div>
          <Link href="#works" scroll className={styles.anchorLink}>
            <Heading translate="no">Works</Heading>
          </Link>
        </div>
        <Section id="histories" className={styles.section3} ref={historyRef}>
          <div>
            <Link href="#histories" scroll className={styles.anchorLink}>
              <Heading translate="no">History</Heading>
            </Link>
          </div>

          <ShowCase items={histories} visibility={historyInView} />
        </Section>

        <Section id="article" className={styles.section3} ref={articleRef}>
          <div>
            <Link href="#article" scroll className={styles.anchorLink}>
              <Heading translate="no">Article</Heading>
            </Link>
          </div>

          <ShowCase items={articles} visibility={articleInView} />
        </Section>

        <Section id="library" className={styles.section3} ref={libraryRef}>
          <div>
            <Link href="#library" scroll className={styles.anchorLink}>
              <Heading translate="no">Library</Heading>
            </Link>
          </div>

          <ShowCase items={libraries} visibility={libraryInView} />
        </Section>
      </Section>
    </animated.div>
  );
};
