/* eslint-disable no-use-before-define */
import { useSpring, animated, useInView, config, useChain, useSpringRef, useTrail } from "@react-spring/web";
import { IconAt, IconBrandGithubFilled, IconBrandTwitterFilled } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { forwardRef, memo } from "react";

import Article from "@components/article";
import Budoux from "@components/budoux";
import Heading from "@components/heading";
import PageHead from "@components/page-head";
import ScrollArea from "@components/scroll-area";
import Section from "@components/section";
import SquareImage from "@components/square-image";
import SwitchTheme from "@components/switch-theme";
import { useMounted } from "@hooks/mounted";
import { isTheme, useWatchSystemTheme } from "@theme";
import { cloudflareImages } from "@utils/cloudflare-images";

import * as styles from "./styles.css";

import type { NextPage } from "next";
import type { ReactNode } from "react";

const Page: NextPage = () => {
  const systemTheme = useWatchSystemTheme();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const mounted = useMounted();
  const firstViewInView = router.asPath === "/";

  const [titleRef, titleInView] = useInView({ once: true });
  const mainVisualAnimApi = useSpringRef();
  const mainVisualAnim = useSpring({
    ref: mainVisualAnimApi,
    from: { opacity: 0 },
    opacity: titleInView || firstViewInView ? 1 : 0,
  });

  const [aboutRef, aboutInView] = useInView({ once: true });
  const aboutAnimApi = useSpringRef();
  const aboutAnim = useSpring({
    ref: aboutAnimApi,
    opacity: aboutInView ? 1 : 0,
    transform: aboutInView ? "translateY(0rem)" : "translateY(0.5rem)",
  });
  useChain([mainVisualAnimApi, aboutAnimApi], [0, 0.5]);

  const [worksRef, worksInView] = useInView({ once: true, rootMargin: "-30% 0%" });
  const worksAnim = useSpring({
    opacity: worksInView ? 1 : 0,
    transform: worksInView ? "translateY(0rem)" : "translateY(0.5rem)",
  });

  const [serviceRef, serviceInView] = useInView({ once: true, rootMargin: "-30% 0%" });
  const [libraryRef, libraryInView] = useInView({ once: true, rootMargin: "-30% 0%" });

  const [contactRef, contactInView] = useInView({ once: true, rootMargin: "-10% 0%" });
  const contactAnim = useSpring({
    opacity: contactInView ? 1 : 0,
    transform: contactInView ? "translateY(0rem)" : "translateY(0.5rem)",
  });

  const decorationImageAnim = useSpring({
    from: {
      transform: `translateX(125%)`,
    },
    to: {
      transform: contactInView ? "translateX(0%)" : `translateX(125%)`,
    },
    config: config.gentle,
    delay: 800,
  });

  return (
    <>
      <PageHead>{/*  */}</PageHead>

      <Section className={styles.pageRoot}>
        <div className={styles.decorationRoot}>
          <div aria-hidden="true" className={styles.decoration1} />
          <div aria-hidden="true" className={styles.decoration2} />
          <animated.div className={styles.decorationImageRoot} aria-hidden="true" style={decorationImageAnim}>
            <img
              className={styles.decorationImage}
              decoding="async"
              srcSet="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/800x800 800w, https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/1600x1600 1600w"
              src="https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/c62aaf15-fa76-4dd6-1cbb-6c75aa1a5f00/1600x1600"
              sizes="(max-width: 1080px) 100vw, 1080px"
              alt="naporitan のオリジナルキャラクター"
              width={800}
              height={800}
              loading="lazy"
            />
          </animated.div>
        </div>
        <div className={styles.switchTheme}>
          {mounted ? (
            <SwitchTheme theme={isTheme(theme) ? theme : undefined} defaultTheme={systemTheme} onChange={setTheme} />
          ) : null}
        </div>

        <div className={styles.firstView}>
          <div className={styles.section1}>
            <div className={styles.pageTitle} ref={titleRef}>
              <Link href="/" scroll className={styles.anchorLink}>
                <Heading>napochaan.com</Heading>
              </Link>
            </div>

            <div className={styles.mainVisualRoot}>
              <animated.img
                className={styles.fillImage}
                style={mainVisualAnim}
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

          <animated.div className={styles.aboutMeWrapper} ref={aboutRef} style={aboutAnim}>
            <Article className={styles.aboutMeRoot} id="about">
              <Link href="/#about" scroll className={styles.anchorLink}>
                <Heading>About me</Heading>
              </Link>
              <div className={styles.aboutMe}>
                <p>
                  <Budoux>
                    自分を表現するために選んだフロントエンドという分野で自分を表現できないままソフトウェアエンジニアとして彷徨い続けている。
                  </Budoux>
                </p>
                <p>
                  <Budoux>
                    現在はプログラムが持つ統一性という部分に惹かれ関数型言語のあり方を好んでおり実は関数になりたいと思っている。
                  </Budoux>
                </p>
              </div>

              <Article className={styles.section3} id="love">
                <div>
                  <Link href="/#love" scroll className={styles.anchorLink}>
                    <Heading>Love</Heading>
                  </Link>
                </div>
                <ul className={styles.tags}>
                  <li>TypeScript</li>
                  <li>Haskell</li>
                  <li>Music(ボカロ)</li>
                  <li>FPS</li>
                </ul>
              </Article>

              <Article className={styles.section3} id="skill">
                <div>
                  <Link href="/#skill" scroll className={styles.anchorLink}>
                    <Heading>Skill</Heading>
                  </Link>
                </div>
                <ul className={styles.tags}>
                  <li>TypeScript</li>
                  <li>React</li>
                  <li>CSS</li>
                  <li>Next.js</li>
                  <li>NestJS</li>
                  <li>firebase</li>
                  <li>GraphQL</li>
                  <li>Python</li>
                  <li>Flask</li>
                  <li>pandas</li>
                  <li>numpy</li>
                  <li>scikit-learn</li>
                  <li>Ruby</li>
                  <li>Rails</li>
                  <li>Swift</li>
                  <li>ReactNative</li>
                  <li>Cloudflare Workers</li>
                  <li>Cloudflare Pages</li>
                  <li>Cloudflare R2</li>
                  <li>Cloudflare Images</li>
                </ul>
              </Article>
            </Article>
          </animated.div>
        </div>

        <animated.div ref={worksRef} className={styles.worksWrapper} style={worksAnim}>
          <Article id="works" className={styles.worksRoot}>
            <div>
              <Link href="/#works" className={styles.anchorLink}>
                <Heading>Works</Heading>
              </Link>
            </div>
            <Article id="service" className={styles.section3} ref={serviceRef}>
              <div>
                <Link href="/#service" scroll className={styles.anchorLink}>
                  <Heading>Service</Heading>
                </Link>
              </div>

              <WorksArea name="service" works={services} visibility={serviceInView} />
            </Article>

            <Article id="library" className={styles.section3} ref={libraryRef}>
              <div>
                <Link href="/#library" scroll className={styles.anchorLink}>
                  <Heading>Library</Heading>
                </Link>
              </div>

              <WorksArea name="library" works={libraries} visibility={libraryInView} />
            </Article>
          </Article>
        </animated.div>

        <animated.div className={styles.contactWrapper} ref={contactRef} style={contactAnim}>
          <Article id="contact" className={styles.contactRoot}>
            <div>
              <Link href="/#contact" scroll className={styles.anchorLink}>
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
                className={styles.textLink}
                aria-label="github link"
                title="github のリンク"
              >
                <IconBrandGithubFilled className={styles.contactItem} aria-hidden="true" />
              </Link>

              <Link
                href="https://twitter.com/naporin24690"
                target="_blank"
                className={styles.textLink}
                aria-label="twitter link"
                title="twitter のリンク"
              >
                <IconBrandTwitterFilled className={styles.contactItem} aria-hidden="true" />
              </Link>
              <Link
                href="mailto:contact@napochaan.com"
                target="_blank"
                className={styles.textLink}
                aria-label="email link"
                title="email のリンク"
              >
                <IconAt className={styles.contactItem} aria-hidden="true" />
              </Link>
            </div>
          </Article>
        </animated.div>
      </Section>
    </>
  );
};

export default Page;

type Work = {
  id: string;
  alt: string;
  caption: ReactNode;
  href: string;
  skills?: string[];
};

type WorksArea = {
  works: Work[];
  visibility?: boolean;
  name: string;
};
const WorksArea = memo(
  forwardRef<HTMLDivElement, WorksArea>(({ works, visibility, name }, ref) => {
    const trails = useTrail(works.length, {
      from: { opacity: 0, transform: "scale(0.8)" },
      opacity: visibility ? 1 : 0,
      transform: visibility ? "scale(1)" : "scale(0.8)",
      config: config.stiff,
    });

    return (
      <ScrollArea orientation="horizontal" ref={ref}>
        {trails.map((style, idx) => (
          <Link
            href={works[idx].href}
            className={styles.textLink}
            target="_blank"
            key={`${name}__${works[idx].id}-${idx}`}
          >
            <animated.div style={style}>
              <SquareImage
                decoding="async"
                loading="lazy"
                {...cloudflareImages(works[idx].id)}
                caption={works[idx].caption}
                alt={works[idx].alt}
              />
            </animated.div>
          </Link>
        ))}
      </ScrollArea>
    );
  }),
);

const services: Work[] = [
  {
    caption: "LGTMジェネレータ",
    alt: "lgtmの画像",
    id: "96f54b5a-176c-4f8c-70cd-754511bd3f00",
    href: "https://lgtm.napochaan.com",
  },
  {
    caption: (
      <span className={styles.wrappedText}>
        flat-工房買取専用
        <wbr />
        アプリの開発
      </span>
    ),
    alt: "買取先頭アプリのスクリーンショット",
    id: "313b54a8-620e-46dc-320d-fe74827d1900",
    href: "https://flat-kobo-kaitori.web.app/",
  },
  {
    caption: (
      <span className={styles.wrappedText}>
        flat-工房
        <wbr />
        ネットショップ
        <wbr />
        UI改善
      </span>
    ),
    alt: "flatkobo.shop のスクリーンショット",
    id: "6e506cc1-daf8-4e75-84d6-a6b709e7c600",
    href: "https://flatkobo.shop",
  },
  {
    caption: (
      <span className={styles.wrappedText}>
        PROJECT BLUE
        <wbr />
        OFFICIAL HP作成
      </span>
    ),
    alt: "pjblue.jp のスクリーンショット",
    id: "94eee0af-68bf-4948-be33-3f8f036b3700",
    href: "https://pjblue.jp",
  },
  {
    caption: (
      <span className={styles.wrappedText}>
        447Records
        <wbr />
        TANAの開発
      </span>
    ),
    alt: "tana.447pro.com のスクリーンショット",
    id: "8349bdbc-22ef-4183-8d52-fd1492747800",
    href: "https://tana.447pro.com/",
  },
  {
    caption: (
      <span className={styles.wrappedText}>
        soelu.com
        <wbr />
        instructorsページ
        <wbr />
        の開発
      </span>
    ),
    alt: "soelu.com/instructors のスクリーンショット",
    id: "af31f5b3-0732-4b4a-b42e-ccaf20f41d00",
    href: "https://twitter.com/naporin24690/status/1244865712490856448?s=20",
  },
  {
    caption: (
      <span className={styles.wrappedText}>
        soelu.com
        <wbr />
        lessonsページ
        <wbr />
        の開発
      </span>
    ),
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
    caption: "react-flowder",
    alt: "npmのロゴ",
    id: "a463002e-d758-4349-3d53-024d21500c00",
    href: "https://www.npmjs.com/package/react-flowder",
  },
  {
    caption: (
      <span className={styles.wrappedText}>
        vanilla-
        <wbr />
        extract-
        <wbr />
        inline
      </span>
    ),
    alt: "vanilla-extractのOGP",
    id: "9fd1d1dd-e97a-443d-5d1f-37760c710a00",
    href: "https://github.com/napolab/vanilla-extract-inline",
  },
  {
    caption: (
      <span className={styles.wrappedText}>
        @naporin0624/
        <wbr />
        eslint-config
      </span>
    ),
    alt: "npmのロゴ",
    id: "a463002e-d758-4349-3d53-024d21500c00",
    href: "https://www.npmjs.com/package/@naporin0624/eslint-config",
  },
  {
    caption: (
      <span className={styles.wrappedText}>
        monaco-editor
        <wbr />
        type-installer
      </span>
    ),
    alt: "gistのOGP",
    id: "51e0d14a-d842-4e33-f20e-70db0d117500",
    href: "https://gist.github.com/naporin0624/2c1c187950738ef4e07a755489ba49de",
  },
];
