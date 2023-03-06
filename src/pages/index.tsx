import Link from "next/link";

import Heading from "@components/heading";
import Section from "@components/section";

import type { NextPage } from "next";

const Page: NextPage = () => {
  return (
    <Section>
      <Heading>aaa</Heading>
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
