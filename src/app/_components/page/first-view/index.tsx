"use client";
import Link from "next/link";

import keyVisualImage from "@assets/napochaan.webp";
import Article from "@components/article";
import Heading from "@components/heading";
import Image from "@components/image";
import { link } from "@theme/css";

import * as styles from "./styles.css";

type Props = {
  tags: string[];
};

export const FirstView = ({ tags }: Props) => {
  return (
    <div className={styles.firstView}>
      <div className={styles.section1}>
        <div className={styles.pageTitle}>
          <Link href="#" scroll className={styles.anchorLink}>
            <Heading translate="no">napochaan.com</Heading>
          </Link>
        </div>

        <div className={styles.mainVisualRoot}>
          <Image
            className={styles.fillImage}
            src={keyVisualImage}
            alt="naporitan のオリジナルキャラクター"
            priority
            width={600}
            height={600}
          />
        </div>
      </div>

      <div className={styles.aboutMeWrapper}>
        <Article className={styles.aboutMeRoot} id="about">
          <Link href="#about" scroll className={styles.anchorLink}>
            <Heading translate="no">About me</Heading>
          </Link>
          <div className={styles.aboutMe}>
            <p className={styles.aboutMeText}>
              プログラマー。専門はウェブサイト制作とWebアプリケーション、モバイルアプリの開発・運営であり、これらを本職としている。
              <br />
              加えて、インターネット上でのクリエイティブな活動にも積極的で、多才なクリエイターが集う{" "}
              <Link href="https://studiognu.org" className={link}>
                StudioGnu
              </Link>{" "}
              に所属し、様々なプロジェクトにおいて技術面での貢献をしている。
            </p>
          </div>

          <Article className={styles.section3} id="love">
            <div>
              <Link href="#love" scroll className={styles.anchorLink}>
                <Heading translate="no">Love</Heading>
              </Link>
            </div>
            <ul className={styles.tags} translate="no">
              <li>TypeScript</li>
              <li>Cloudflare Workers</li>
              <li>Music(ボカロ)</li>
              <li>ニーゴ(プロセカ)</li>
              <li>valorant</li>
              <li>東方</li>
            </ul>
          </Article>

          <Article className={styles.section3} id="skill">
            <div>
              <Link href="#skill" scroll className={styles.anchorLink}>
                <Heading translate="no">Skill</Heading>
              </Link>
            </div>
            <ul className={styles.tags} translate="no">
              {tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </Article>
        </Article>
      </div>
    </div>
  );
};
