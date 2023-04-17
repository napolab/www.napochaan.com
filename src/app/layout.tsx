"use client";
import { Noto_Sans_JP, Poppins } from "next/font/google";

import { HeadingLevelProvider } from "@hooks/heading-level";
import { ThemeProvider } from "@theme";
import { clsx } from "@utils/clsx";

import * as styles from "./layout.css";

import type { FC, PropsWithChildren } from "react";

import "@acab/reset.css";

const notoSansJP = Noto_Sans_JP({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--noto-sans-jp",
});
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--poppins",
});

const fonts = clsx(notoSansJP.className, notoSansJP.variable, poppins.className, poppins.variable);

type Props = PropsWithChildren<{
  //
}>;

const RootLayout: FC<Props> = ({ children }) => {
  return (
    <html lang="ja">
      <body className={fonts}>
        <ThemeProvider defaultTheme="dark">
          <HeadingLevelProvider>
            <main className={styles.mainRoot}>{children}</main>
          </HeadingLevelProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
