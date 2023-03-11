import Head from "next/head";
import { memo } from "react";

import type { FC } from "react";

const pageTitle = "www.napochaan.com";

export type PageTitleProps = {
  title?: string;
};
const PageTitle: FC<PageTitleProps> = ({ title }) => {
  return (
    <Head>
      {title === undefined && <title>{pageTitle}</title>}
      {title ? (
        <title>
          {title} | {pageTitle}
        </title>
      ) : null}
    </Head>
  );
};

export default memo(PageTitle);
