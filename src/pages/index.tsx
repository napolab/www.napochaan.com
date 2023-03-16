import Link from "next/link";

import Heading from "@components/heading";
import PageHead from "@components/page-head";
import Section from "@components/section";
import Switch from "@components/switch";
import { link } from "@theme/css";

import * as styles from "./styles.css";

import type { NextPage } from "next";

const Page: NextPage = () => {
  return (
    <>
      <PageHead title="Home" />

      <Section className={styles.pageRoot}>
        <Heading>aaa</Heading>
        <Section className={styles.section}>
          <Heading>bbb</Heading>
          <Switch aria-label="switch" defaultChecked />
        </Section>

        <p>www.napochaan.com</p>
        <p>
          ここは
          <Link href="https://twitter.com/naporin24690" target="_blank" className={link}>
            @naporin24690
          </Link>
          の WebSite です。
        </p>
      </Section>
    </>
  );
};

export default Page;
