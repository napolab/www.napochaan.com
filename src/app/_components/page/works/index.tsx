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
};

export const Works = ({ histories, libraries }: Props) => {
  const [worksRef, worksInView] = useInView({ once: true, rootMargin: "-30% 0%" });
  const worksAnim = useSpring({
    opacity: worksInView ? 1 : 0,
    transform: worksInView ? "translateY(0rem)" : "translateY(0.5rem)",
  });

  const [serviceRef, serviceInView] = useInView({ once: true });
  const [libraryRef, libraryInView] = useInView({ once: true });

  return (
    <animated.div ref={worksRef} className={styles.worksWrapper} style={worksAnim}>
      <Section id="works" className={styles.worksRoot}>
        <div>
          <Link href="#works" scroll className={styles.anchorLink}>
            <Heading translate="no">Works</Heading>
          </Link>
        </div>
        <Section id="histories" className={styles.section3} ref={serviceRef}>
          <div>
            <Link href="#histories" scroll className={styles.anchorLink}>
              <Heading translate="no">History</Heading>
            </Link>
          </div>

          <ShowCase items={histories} visibility={serviceInView} />
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
