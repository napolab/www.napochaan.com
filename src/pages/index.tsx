import Link from "next/link";

import Heading from "@components/heading";
import Section from "@components/section";

import * as styles from "./styles.css";

import type { NextPage } from "next";

const Page: NextPage = () => {
  return (
    <Section className={styles.container}>
      <Heading>aaa</Heading>
      <Section className={styles.section}>
        <Heading>bbb</Heading>

        <ul>
          <li>
            <div />
          </li>
        </ul>
      </Section>

      <p>www.napochaan.com</p>
      <p>
        ここは
        <Link href="https://twitter.com/naporin24690" target="_blank">
          @naporin24690
        </Link>
        の WebSite です。
      </p>
    </Section>
  );
};

export default Page;
