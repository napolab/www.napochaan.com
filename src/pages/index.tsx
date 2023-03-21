/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { IconAt, IconBrandGithubFilled, IconBrandTwitterFilled } from "@tabler/icons-react";
import Link from "next/link";

import Article from "@components/article";
import Budoux from "@components/budoux";
import Heading from "@components/heading";
import PageHead from "@components/page-head";
import Section from "@components/section";
import SquareImage from "@components/square-image";

import * as styles from "./styles.css";

import type { NextPage } from "next";

const Page: NextPage = () => {
  return (
    <>
      <PageHead title="Home" />

      <Section className={styles.pageRoot}>
        <div aria-hidden="true" className={styles.decorationRoot}>
          <div aria-hidden="true" className={styles.decoration1} />
          <div aria-hidden="true" className={styles.decoration2} />
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
                    僕はwebアプリケーションエンジニアで、React や TypeScript
                    を使ったフロントエンドの状態管理を得意としています。
                  </Budoux>
                </p>

                <p>
                  <Budoux>
                    趣味は音楽を聴くこと、新しい技術に触れること、漫画を読むこと、Valorantをすることです。
                  </Budoux>
                </p>
                <p>
                  <Budoux>
                    好きな言語はTypeScriptとHaskellで、その他にもJavaScript、Python、Ruby、Swiftなど、多様な言語に触れています。
                  </Budoux>
                </p>
                <p>
                  <Budoux>
                    最近は、i18nやa11yといったWebで実現して提供する技術や、最速でユーザーにWebページを表示する技術に興味があります。
                  </Budoux>
                </p>
              </div>
            </Article>
          </div>
        </div>

        <Article id="works" className={styles.worksRoot}>
          <div>
            <Link href="/#work" className={styles.anchorLink}>
              <Heading>Works</Heading>
            </Link>
          </div>
          <Article id="application">
            <Link href="/#application" className={styles.anchorLink}>
              <Heading>Application</Heading>
            </Link>
            <ul className={styles.scrollArea} tabIndex={0}>
              {new Array(6).fill(null).map((_, index) => (
                <li key={`application__${index}`}>
                  <Link href="#" className={styles.link}>
                    <SquareImage src="https://lgtm.napochaan.com" caption="flatkobo.shop の UI 改善" />
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
              {new Array(6).fill(null).map((_, index) => (
                <li key={`library__${index}`}>
                  <Link href="#" className={styles.link}>
                    <SquareImage src="https://lgtm.napochaan.com" caption="flatkobo.shop の UI 改善" />
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
