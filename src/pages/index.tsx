import Article from "@components/article";
import Budoux from "@components/budoux";
import Heading from "@components/heading";
import PageHead from "@components/page-head";
import Section from "@components/section";
import Title from "public/title.svg";

import * as styles from "./styles.css";

import type { NextPage } from "next";

const Page: NextPage = () => {
  return (
    <>
      <PageHead title="Home" />

      <Section className={styles.pageRoot}>
        <div className={styles.firstView}>
          <div className={styles.section1}>
            <div className={styles.titleRoot}>
              <Heading unstyled aria-label="napochaan.com" className={styles.pcHeading}>
                <Title aria-disabled="true" className={styles.pcLogo} />
              </Heading>

              <Heading className={styles.spHeading}>napochaan.com</Heading>
            </div>

            <img
              className={styles.characterImage}
              loading="lazy"
              decoding="async"
              src={"https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c161150a-80cb-4783-4bda-870c85e5de00/square"}
              alt="naporitan のオリジナルキャラクター"
              width={800}
              height={800}
            />
          </div>

          <Article className={styles.aboutMeRoot}>
            <Heading>About me</Heading>
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
                <Budoux>趣味は音楽を聴くこと、新しい技術に触れること、漫画を読むこと、Valorantをすることです。</Budoux>
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
      </Section>
    </>
  );
};

export default Page;
