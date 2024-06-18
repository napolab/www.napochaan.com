"use client";
import { useInView, useSpringRef, useSpring, useChain, animated } from "@react-spring/web";
import Link from "next/link";
import { usePathname } from "next/navigation";

import keyVisualImage from "@assets/napochaan.webp";
import Article from "@components/article";
import Budoux from "@components/budoux";
import Heading from "@components/heading";
import Image from "@components/image";

import * as styles from "./styles.css";

const AnimatedImage = animated(Image);

type Props = {
  tags: string[];
};

export const FirstView = ({ tags }: Props) => {
  const [titleRef, titleInView] = useInView({ once: true });
  const pathname = usePathname();
  const firstViewInView = pathname === "/";
  const mainVisualInView = titleInView || firstViewInView;

  const mainVisualAnimApi = useSpringRef();
  const mainVisualAnim = useSpring({
    ref: mainVisualAnimApi,
    from: { opacity: 0 },
    opacity: mainVisualInView ? 1 : 0,
  });

  const [aboutRef, aboutInView] = useInView({ once: true });
  const aboutAnimApi = useSpringRef();
  const aboutAnim = useSpring({
    ref: aboutAnimApi,
    opacity: aboutInView ? 1 : 0,
    transform: aboutInView ? "translateY(0rem)" : "translateY(0.5rem)",
  });
  useChain([mainVisualAnimApi, aboutAnimApi], [0, 0.5]);

  return (
    <div className={styles.firstView}>
      <div className={styles.section1}>
        <div className={styles.pageTitle} ref={titleRef}>
          <Link href="#" scroll className={styles.anchorLink}>
            <Heading translate="no">napochaan.com</Heading>
          </Link>
        </div>

        <div className={styles.mainVisualRoot}>
          <AnimatedImage
            className={styles.fillImage}
            style={mainVisualAnim}
            src={keyVisualImage}
            alt="naporitan のオリジナルキャラクター"
            priority
            width={600}
            height={600}
          />
        </div>
      </div>

      <animated.div className={styles.aboutMeWrapper} ref={aboutRef} style={aboutAnim}>
        <Article className={styles.aboutMeRoot} id="about">
          <Link href="#about" scroll className={styles.anchorLink}>
            <Heading translate="no">About me</Heading>
          </Link>
          <div className={styles.aboutMe}>
            <p>
              <Budoux>
                プログラマー。専門はウェブサイト制作とWebアプリケーション、モバイルアプリの開発・運営であり、これらを本職としている。加えて、インターネット上でのクリエイティブな活動にも積極的で、多才なクリエイターが集うStudioGnuに所属し、様々なプロジェクトにおいて技術面での貢献をしている。
              </Budoux>
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
              <li>Valorant</li>
              <li>東方</li>
              <li>ニーゴ(プロセカ)</li>
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
      </animated.div>
    </div>
  );
};
