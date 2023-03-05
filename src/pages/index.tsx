import Link from "next/link";

import type { NextPage } from "next";

const Page: NextPage = () => {
  return (
    <section>
      <h1>Hello World</h1>
      <p>www.napochaan.com</p>
      <p>
        ここは
        <Link href="https://twitter.com/naporin24690" target="_blank">
          @naporin24690
        </Link>
        の WebSite です。
      </p>
    </section>
  );
};

export default Page;
