"use client";

import { animated, useInView, useSpring } from "@react-spring/web";
import { IconBrandGithubFilled, IconBrandX, IconAt } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect } from "react";

import Heading from "@components/heading";
import IconZenn from "@components/icons/zenn.svg";
import Section from "@components/section";

import * as source from "../source";

import * as styles from "./styles.css";

export const Contact = () => {
  const [contactRef, contactInView] = useInView({ once: true, rootMargin: "-10% 0%" });
  useEffect(() => {
    source.contactInView.next(contactInView);
  }, [contactInView]);

  const contactAnim = useSpring({
    opacity: contactInView ? 1 : 0,
    transform: contactInView ? "translateY(0rem)" : "translateY(0.5rem)",
  });

  return (
    <animated.div className={styles.contactWrapper} ref={contactRef} style={contactAnim}>
      <Section id="contact" className={styles.contactRoot}>
        <div>
          <Link href="/#contact" scroll className={styles.anchorLink}>
            <Heading translate="no">SNS&nbsp;&amp;&nbsp;Contact</Heading>
          </Link>
        </div>
        <p>ポストはしてないですが、連絡は X の DM が一番つながりやすいです。</p>

        <address className={styles.contactList}>
          <Link
            href="https://github.com/naporin0624"
            target="_blank"
            className={styles.textLink}
            aria-label="github link"
            title="github のリンク"
          >
            <IconBrandGithubFilled className={styles.contactItem} aria-hidden="true" />
          </Link>

          <Link
            href="https://x.com/naporin24690"
            target="_blank"
            className={styles.textLink}
            aria-label="X link"
            title="X のリンク"
          >
            <IconBrandX className={styles.contactItem} aria-hidden="true" />
          </Link>
          <Link
            href="https://zenn.dev/naporin24690"
            target="_blank"
            className={styles.textLink}
            aria-label="zenn link"
            title="zenn のリンク"
          >
            <IconZenn className={styles.contactItem} aria-hidden="true" />
          </Link>
          <Link
            href="mailto:contact@napochaan.com"
            target="_blank"
            className={styles.textLink}
            aria-label="email link"
            title="email のリンク"
          >
            <IconAt className={styles.contactItem} aria-hidden="true" />
          </Link>
        </address>
      </Section>
    </animated.div>
  );
};
