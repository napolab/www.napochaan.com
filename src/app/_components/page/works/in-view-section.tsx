"use client";
import { useInView } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

import Heading from "@components/heading";
import Section from "@components/section";
import ShowCase from "@components/show-case";

import * as styles from "./styles.css";

import type { ShowCaseItem } from "@components/show-case";

interface InViewSectionProps {
  id: string;
  title: string;
  items: ShowCaseItem[];
  className?: string;
}

export const InViewSection = ({ id, title, items, className }: InViewSectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <Section id={id} className={className} ref={ref}>
      <div>
        <Link href={`#${id}`} scroll className={styles.anchorLink}>
          <Heading translate="no">{title}</Heading>
        </Link>
      </div>

      <ShowCase items={items} visibility={isInView} />
    </Section>
  );
};
