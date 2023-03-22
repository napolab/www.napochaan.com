/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { IconAt, IconBrandGithubFilled, IconBrandTwitterFilled } from "@tabler/icons-react";
import Link from "next/link";

import Article from "@components/article";
import Budoux from "@components/budoux";
import Heading from "@components/heading";
import PageHead from "@components/page-head";
import Section from "@components/section";
import SquareImage from "@components/square-image";
import { cloudflareImages } from "@utils/cloudflare-images";

import * as styles from "./styles.css";

import type { NextPage } from "next";

const Page: NextPage = () => {
  return (
    <>
      <PageHead title="Home" />

      <Section className={styles.pageRoot}>
        <div className={styles.decorationRoot}>
          <div aria-hidden="true" className={styles.decoration1} />
          <div aria-hidden="true" className={styles.decoration2} />
          <div className={styles.decorationImage} aria-hidden="true">
            <img
              className={styles.characterImage}
              decoding="async"
              srcSet="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/800x800 800w, https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/1600x1600 1600w"
              src="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/1600x1600"
              sizes="(max-width: 1080px) 100vw, 1080px"
              alt="naporitan のオリジナルキャラクター"
              width={800}
              height={800}
            />
          </div>
        </div>

        <div className={styles.firstView}>
          <div className={styles.section1}>
            <Heading className={styles.heading1}>napochaan.com</Heading>

            <div className={styles.characterImageRoot}>
              <img
                className={styles.characterImage}
                decoding="async"
                srcSet="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/800x800 800w, https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/1600x1600 1600w"
                src="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/1600x1600"
                sizes="(max-width: 1080px) 100vw, 1080px"
                alt="naporitan のオリジナルキャラクター"
                width={800}
                height={800}
              />
            </div>
          </div>

          <div className={styles.aboutMeWrapper}>
            <Article className={styles.aboutMeRoot} id="about">
              <Link href="/#about" scroll className={styles.anchorLink}>
                <Heading>About me</Heading>
              </Link>
              <div className={styles.aboutMe}>
                <p>
                  <Budoux>こんにちは、naporitan です。</Budoux>
                </p>
                <p>
                  <Budoux>
                    僕はwebアプリケーションエンジニアで、ReactやTypeScriptを使ったフロントエンドの状態管理を得意としています。
                  </Budoux>
                </p>

                <p>
                  <Budoux>趣味は音楽を聴くこと、新しい技術に触れること、漫画を読むこと、FPSをすることです。</Budoux>
                </p>
                <p>
                  <Budoux>
                    TypeScriptとHaskellがお気に入りの言語で、その他にもJavaScript、Python、Ruby、Swiftもたまに書きます。
                  </Budoux>
                </p>
                <p>
                  <Budoux>
                    最近は、i18nやa11yをWebで実現して提供する技術や、最速でユーザーにWebページを表示する技術に興味があります。
                  </Budoux>
                </p>
              </div>
            </Article>
          </div>
        </div>

        <Article id="works" className={styles.worksRoot}>
          <div>
            <Link href="/#works" className={styles.anchorLink}>
              <Heading>Works</Heading>
            </Link>
          </div>
          <Article id="service">
            <Link href="/#service" className={styles.anchorLink}>
              <Heading>Service</Heading>
            </Link>
            <ul className={styles.scrollArea} tabIndex={0}>
              {services.map((service) => (
                <li key={`application__${service.id}`}>
                  <Link href={service.href} className={styles.link} target="_blank">
                    <SquareImage
                      decoding="async"
                      {...cloudflareImages(service.id)}
                      caption={service.caption}
                      alt={service.alt}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Article>

          <Article id="library">
            <Link href="/#library" className={styles.anchorLink}>
              <Heading>Library</Heading>
            </Link>
            <ul className={styles.scrollArea} tabIndex={0}>
              {libraries.map((library) => (
                <li key={`library__${library.id}`}>
                  <Link href={library.href} className={styles.link} target="_blank">
                    <SquareImage
                      decoding="async"
                      {...cloudflareImages(library.id)}
                      caption={library.caption}
                      alt={library.alt}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Article>
        </Article>

        <div className={styles.contactWrapper}>
          <Article id="contact" className={styles.contactRoot}>
            <div>
              <Link href="/#contact" className={styles.anchorLink}>
                <Heading>SNS&nbsp;&amp;&nbsp;Contact</Heading>
              </Link>
            </div>
            <p>
              <Budoux>連絡は twitter の DM が一番つながりやすいです。</Budoux>
            </p>

            <div className={styles.contactList}>
              <Link
                href="https://github.com/naporin0624"
                target="_blank"
                className={styles.link}
                aria-label="github link"
                title="github のリンク"
              >
                <IconBrandGithubFilled className={styles.icon} aria-hidden="true" />
              </Link>

              <Link
                href="https://twitter.com/naporin24690"
                target="_blank"
                className={styles.link}
                aria-label="twitter link"
                title="twitter のリンク"
              >
                <IconBrandTwitterFilled className={styles.icon} aria-hidden="true" />
              </Link>
              <Link
                href="mailto:contact@napochaan.com"
                target="_blank"
                className={styles.link}
                aria-label="email link"
                title="email のリンク"
              >
                <IconAt className={styles.icon} aria-hidden="true" />
              </Link>
            </div>
          </Article>
        </div>
      </Section>
    </>
  );
};

export default Page;

type Work = {
  id: string;
  alt: string;
  caption: string;
  href: string;
};
const services: Work[] = [
  {
    caption: "LGTMジェネレータ",
    alt: "lgtmの画像",
    id: "96f54b5a-176c-4f8c-70cd-754511bd3f00",
    href: "https://lgtm.napochaan.com",
  },
  {
    caption: "flat-工房買取専用アプリの開発",
    alt: "買取先頭アプリのスクリーンショット",
    id: "313b54a8-620e-46dc-320d-fe74827d1900",
    href: "https://flat-kobo-kaitori.web.app/",
  },
  {
    caption: "flat-工房ネットショップUI改善",
    alt: "flatkobo.shop のスクリーンショット",
    id: "6e506cc1-daf8-4e75-84d6-a6b709e7c600",
    href: "https://flatkobo.shop",
  },
  {
    caption: "PROJECT BLUE OFFICIAL HP作成",
    alt: "pjblue.jp のスクリーンショット",
    id: "94eee0af-68bf-4948-be33-3f8f036b3700",
    href: "https://pjblue.jp",
  },
  {
    caption: "447Records TANAの開発",
    alt: "tana.447pro.com のスクリーンショット",
    id: "8349bdbc-22ef-4183-8d52-fd1492747800",
    href: "https://tana.447pro.com/",
  },
  {
    caption: "soelu.com instructor ページの開発",
    alt: "soelu.com/instructors のスクリーンショット",
    id: "af31f5b3-0732-4b4a-b42e-ccaf20f41d00",
    href: "https://twitter.com/naporin24690/status/1244865712490856448?s=20",
  },
  {
    caption: "soelu.com lesson ページの開発",
    alt: "soelu.com/lessons のスクリーンショット",
    id: "fdd649b4-067e-4f93-493d-0770935f6900",
    href: "https://twitter.com/naporin24690/status/1227830616227344384",
  },
  {
    caption: "名取さなさんのファンアプリ開発",
    alt: "名取さなさんがPCの上に絶っている写真",
    id: "0f48a932-ef98-482d-a33f-68590a059e00",
    href: "https://twitter.com/naporin24690/status/1106641342506004480",
  },
  {
    caption: "名取さなさんのファンアプリ開発",
    alt: "タスクを操作している様子",
    id: "91b28c8e-f38b-4833-0582-2e73e12fe500",
    href: "https://twitter.com/naporin24690/status/1091367573587865601",
  },
];

const libraries: Work[] = [
  {
    caption: "rxjsベースのReactの状態管理ライブラリ",
    alt: "npmのロゴ",
    id: "a463002e-d758-4349-3d53-024d21500c00",
    href: "https://www.npmjs.com/package/react-flowder",
  },
  {
    caption: "vanilla-extractをinline化するライブラリ",
    alt: "vanilla-extractのOGP",
    id: "9fd1d1dd-e97a-443d-5d1f-37760c710a00",
    href: "https://github.com/napolab/vanilla-extract-inline",
  },
  {
    caption: "naporin0624のeslint config",
    alt: "npmのロゴ",
    id: "a463002e-d758-4349-3d53-024d21500c00",
    href: "https://www.npmjs.com/package/@naporin0624/eslint-config",
  },
  {
    caption: "monaco-editorにtypescriptの型読み込ませる",
    alt: "gistのOGP",
    id: "51e0d14a-d842-4e33-f20e-70db0d117500",
    href: "https://gist.github.com/naporin0624/2c1c187950738ef4e07a755489ba49de",
  },
];
