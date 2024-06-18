import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Noto_Sans_JP, Poppins } from "next/font/google";

import { HeadingLevelProvider } from "@hooks/heading-level";
import { ThemeProvider } from "@theme";
import { clsx } from "@utils/clsx";

import { SwitchTheme } from "./_components/layout/switch-theme";
import * as styles from "./layout.css";

import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tokyo");

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

const RootLayout = async ({ children }: Props) => {
  return (
    <html lang="ja">
      <head>{/* <OptimizeTypeKit projectId="ygf6mjq" /> */}</head>

      <body className={fonts}>
        <ThemeProvider defaultTheme="dark">
          <HeadingLevelProvider>
            <main className={styles.mainRoot}>{children}</main>
            <footer className={styles.footerRoot} translate="no">
              ©2023-2024 naporitan
            </footer>
            <SwitchTheme />
          </HeadingLevelProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

const description = "ReactとTypeScriptのオタクだったりオタクじゃなかったりします。";

export const viewport: Viewport = {
  themeColor: "#fff",
  colorScheme: "light dark",
};
export const metadata: Metadata = {
  metadataBase: new URL("https://napochaan.com"),
  title: "napochaan",
  icons: {
    icon: [
      { url: "/favicon.ico", rel: "icon" },
      { sizes: "32x32", url: "/favicon-32x32.png", rel: "icon" },
      { sizes: "16x16", url: "/favicon-16x16.png", rel: "icon" },
    ],
    apple: [{ sizes: "180x180", url: "/apple-touch-icon.png", rel: "apple-touch-icon" }],
  },
  manifest: "/site.webmanifest",
  keywords: ["naporitan", "engineer", "web", "application", "react", "typescript", "frontend"],
  authors: { name: "naporitan", url: "https://twitter.com/naporin24690" },
  description,
  openGraph: {
    type: "website",
    title: "naporitan official website",
    siteName: "napochaan",
    url: "https://napochaan.com/",
    images: "/ogp.png",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "@naporin24690 official website",
    images: "/ogp.png",
    description,
    creator: "@naporin24690",
    creatorId: "@naporin24690",
  },
};
export const runtime = "edge";
export default RootLayout;
