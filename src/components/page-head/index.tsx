import Head from "next/head";
import { memo } from "react";

import type { FC, PropsWithChildren } from "react";

const site = "www.napochaan.com";

export type PageTitleProps = PropsWithChildren<{
  title?: string;
}>;
const PageHead: FC<PageTitleProps> = (props) => {
  return (
    <Head>
      {props.children}
      <title>{props.title ? `${props.title} | ${site}` : site}</title>
    </Head>
  );
};

export default memo(PageHead);
