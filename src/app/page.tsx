"use client";
import { useSpring, animated, useInView, config, useChain, useSpringRef } from "@react-spring/web";
import { IconAt, IconBrandGithubFilled, IconBrandX } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import React, { memo, useEffect, useMemo } from "react";
import { mergeRefs } from "react-merge-refs";
import { useMedia } from "use-media";

import heroImage from "@assets/napochaan.webp";
import Article from "@components/article";
import Budoux from "@components/budoux";
import { DialogRoot, DialogContent, DialogTrigger } from "@components/dialog";
import Heading from "@components/heading";
import IconZenn from "@components/icons/zenn.svg";
import Image from "@components/image";
import Section from "@components/section";
import ShowCase from "@components/show-case";
import SquareImage from "@components/square-image";
import SwitchTheme from "@components/switch-theme";
import WrappedText from "@components/wrapped-text";
import { isTheme } from "@theme";
import { vars, mediaQueries } from "@theme/css";
import reportAccessibility from "@utils/report-accessibility";

import * as styles from "./styles.css";

import type { NextPage } from "next";
import type { FC } from "react";

const AnimatedImage = animated(Image);

const Page: NextPage = () => {
  const isXL = useMedia(mediaQueries.xl);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const firstViewInView = pathname === "/";

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

  const [serviceRef, serviceInView] = useInView({ once: true });
  const [libraryRef, libraryInView] = useInView({ once: true });

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

  const [lastRef, lastInView] = useInView();
  const themeSwitchAnim = useSpring({
    transform: !isXL && lastInView ? "translateY(100%)" : "translateY(0%)",
    bottom: !isXL && lastInView ? "0rem" : vars.space.md,
  });

  const historiesItems = useMemo(
    () =>
      histories.map((item, idx) => ({
        key: `histories__${item.src}-${idx}`,
        children: <WorkItem {...item} />,
      })),
    [],
  );

  const libraryItems = useMemo(
    () =>
      libraries.map((item, idx) => ({
        key: `library__${item.src}-${idx}`,
        children: <WorkItem {...item} />,
      })),
    [],
  );

  useEffect(() => {
    void reportAccessibility(React);
  }, []);

  return (
    <Section className={styles.pageRoot}>
      <div className={styles.decorationRoot}>
        <div aria-hidden="true" className={styles.decoration1} />
        <div aria-hidden="true" className={styles.decoration2} />
        <animated.div className={styles.decorationImageRoot} aria-hidden="true" style={decorationImageAnim}>
          <Image
            className={styles.decorationImage}
            src={heroImage}
            alt="naporitan のオリジナルキャラクター"
            width={800}
            height={800}
            priority
          />
        </animated.div>
      </div>
      <animated.div className={styles.switchTheme} style={themeSwitchAnim}>
        <SwitchTheme theme={isTheme(theme) ? theme : undefined} defaultTheme="dark" onChange={setTheme} />
      </animated.div>

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
              src={heroImage}
              alt="naporitan のオリジナルキャラクター"
              width={800}
              height={800}
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
                {techTags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </Article>
          </Article>
        </animated.div>
      </div>

      <animated.div ref={worksRef} className={styles.worksWrapper} style={worksAnim}>
        <Section id="works" className={styles.worksRoot}>
          <div>
            <Link href="#works" scroll className={styles.anchorLink}>
              <Heading translate="no">Works</Heading>
            </Link>
          </div>
          <Section id="histories" className={styles.section3} ref={serviceRef}>
            <div>
              <Link href="#histories" scroll className={styles.anchorLink}>
                <Heading translate="no">History</Heading>
              </Link>
            </div>

            <ShowCase items={historiesItems} visibility={serviceInView} />
          </Section>

          <Section id="library" className={styles.section3} ref={libraryRef}>
            <div>
              <Link href="#library" scroll className={styles.anchorLink}>
                <Heading translate="no">Library</Heading>
              </Link>
            </div>

            <ShowCase items={libraryItems} visibility={libraryInView} />
          </Section>
        </Section>
      </animated.div>

      <animated.div className={styles.contactWrapper} ref={mergeRefs([contactRef, lastRef])} style={contactAnim}>
        <Section id="contact" className={styles.contactRoot}>
          <div>
            <Link href="/#contact" scroll className={styles.anchorLink}>
              <Heading translate="no">SNS&nbsp;&amp;&nbsp;Contact</Heading>
            </Link>
          </div>
          <p>
            <Budoux>連絡は X の DM が一番つながりやすいです。</Budoux>
            <Link href="https://bento.me/napochaan" target="_blank" className={styles.link}>
              bento.me
            </Link>
          </p>

          <address className={styles.contactList}>
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
              href="https://x.com/naporin24690"
              target="_blank"
              className={styles.textLink}
              aria-label="X link"
              title="X のリンク"
            >
              <IconBrandX className={styles.contactItem} aria-hidden="true" />
            </Link>
            <Link
              href="https://zenn.dev/naporin24690"
              target="_blank"
              className={styles.textLink}
              aria-label="zenn link"
              title="zenn のリンク"
            >
              <IconZenn className={styles.contactItem} aria-hidden="true" />
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
          </address>
        </Section>
      </animated.div>
    </Section>
  );
};

export default memo(Page);

const techTags: string[] = [
  "TypeScript",
  "React",
  "CSS",
  "css module",
  "vanilla-extract",
  "Next.js",
  "Hono",
  "NestJS",
  "firebase",
  "ReactNative",
  "Expo",
  "GraphQL",
  "Python",
  "Flask",
  "FastAPI",
  "pandas",
  "NumPy",
  "scikit-learn",
  "Ruby",
  "Rails",
  "Swift",
  "Cloudflare Workers",
  "Cloudflare Pages",
  "Cloudflare R2",
  "Cloudflare Images",
];

type Work = {
  src: string;
  alt: string;
  caption: string[];
  href: string;
  content: string;
};
const WorkItem = memo((item) => {
  return (
    <DialogRoot>
      <DialogTrigger>
        <SquareImage src={item.src} caption={<WrappedText texts={item.caption} />} alt={item.alt} />
      </DialogTrigger>
      <DialogContent title={<WrappedText texts={item.caption} />}>
        <div className={styles.dialogContent}>
          <div className={styles.description}>
            <Budoux>{item.content}</Budoux>
          </div>

          {item.href ? (
            <Link href={item.href} target="_blank" className={styles.link}>
              外部リンク
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}) satisfies FC<Work>;

const histories: Work[] = [
  {
    src: "/images/histories/next-demo.napochaan.dev.png",
    alt: "Next.js on Cloudflare Pages のデモページのスクリーンショット",
    caption: ["CF Images & `next/image`", "デモページ作成"],
    href: "https://next-demo.napochaan.dev",
    content: [
      "next-on-pages でビルドされる Next.js でも `next/image` を使用したいというコンセプトで作成した。",
      "`/_next/image` に対して Cloudflare Image を使って画像加工を行う Worker Routes を設定することで、vercel を使ったほうな体験が実現できないか実験した。",
      "vercel よりも Cloudflare Images を使用した画像変換のほうが料金を大幅に抑えられそうなことが分かった。",
      "使用した画像は Stable Diffusion を使用して生成した画像である。銀髪の子がかわいいとされている。",
    ].join("\n"),
  },
  {
    src: "/images/histories/flatkobo-hp.png",
    alt: "flat-工房 HP のスクリーンショット",
    caption: ["flat-工房 HP", "の作成"],
    href: "https://www.flatkobo.com",
    content: [
      "flat-工房の HP 制作サポートを行った。",
      "Next.js を Cloudflare Pages で動かし、画像最適化には Cloudflare Worker と Cloudflare Images を利用している。",
      "また、コンタクトフォームは ServerAction と Resend を用いて実装しており、bot による送信防止のために Cloudflare WAF によるページ検証を入れるなど、安全な運用にも気を配った。",
    ].join("\n"),
  },
  {
    src: "/images/histories/kanata.png",
    alt: "KANATA LP のスクリーンショット",
    caption: ["UTAU 彼方の LP"],
    href: "https://www.studiognu.org/lp/kanata",
    content: [
      "StudioGnu で公開した UTAU 彼方の LP を作成した。",
      "利用規約を必ず読んでほしいという要望があったため、特にダウンロードの実装に力を入れている。",
      "Cloudflare Turnstile で bot を排除した後に数分間だけ有効な signed URL がダウンロードリンクになっている。",
      "またダウンロードリンクには DurableObjects で作られたダウンロードカウンターが搭載されており、そうダウンロード数が確認可能。",
    ].join("\n"),
  },
  {
    src: "/images/histories/vocacolle-2024.png",
    alt: "ボカコレ2024冬のランキング",
    caption: ["ボカコレ2024冬", "ランキングの作成"],
    href: "https://vocaloid-collection-archive.studiognu.org/2024/winter",
    content: [
      "ボカコレランキング 2023 夏アーカイブからフロントエンドは変わっていないが、サーバー実装を大幅に強化した",
      "Cloudflare Cron Trigger で取得したランキングの snapshot を drizzle で Cloudflare D1 に保存するように変更した。",
    ].join("\n"),
  },
  {
    src: "/images/histories/www.studiognu.org_ja.png",
    alt: "StudioGnu HP のスクリーンショット",
    caption: ["StudioGnu HP", "の作成"],
    href: "https://www.studiognu.org",
    content: [
      "StudioGnu の HP を作成した。",
      "Next.js と vanilla-extract を主に使用している。データ入稿部は MicroCMS を用いており、Interweave を利用して文字列を HTML として変換している。",
      "また、作品ごとに動的な og:image が生成されるようになっている。これには next/og を利用した。",
    ].join("\n"),
  },
  {
    src: "/images/histories/duree.jpg",
    alt: "楽曲「デュレエ」関連データ解析セクションのスクリーンショット",
    caption: ["楽曲「デュレエ」", "関連データ解析"],
    href: "https://www.youtube.com/watch?v=dpT-ZAPVvyI",
    content: [
      "楽曲「デュレエ」の一部で使われているデータの解析を担当した。",
      "データ分析部は JupyterLab と pandas, numpy を描画には matplotlib, NetWorkX と js の canvas を用いた。",
      "サムネイル変遷においては 描画する内容が膨大で matplotlib では処理できなかったため、 canvas で行っている。",
      "適切なアウトプットを行うために言語に縛られずに動けた。",
    ].join("\n"),
  },
  {
    src: "/images/histories/OKIAF.png",
    alt: "大阪関西国際芸術祭2023に出展したシステム図",
    caption: ["「多面体、鏡面」", "システム作成"],
    href: "https://x.com/StudioGnu/status/1741010587495416144?s=20",
    content:
      "大阪関西国際芸術祭2023に出展するためのシステムを作成した。\n感想投稿、ChatGPT API と stable diffusion による自動動画生成の仕組みを作成、ポスター、投稿コメント表示画面の実装を行った。大部分を cloudflare の製品で作るという技術的にも挑戦的なことを行った。",
  },
  {
    src: "/images/histories/1st-album.hakualab.org_.png",
    alt: "シャノン 1st アルバム LP",
    caption: ["第一象徴体系 LP 作成"],
    href: "https://1st-album.hakualab.org/",
    content: "シャノンさんの 1st アルバムの LP を作成した。\nFigma でデザインを行い、Astro で実装した。",
  },
  {
    src: "/images/histories/meishi-v1.jpg",
    caption: ["オリジナル名刺", "の作成"],
    alt: "naporitan の名刺",
    href: "https://x.com/naporin24690/status/1705577231928697299",
    content:
      "名刺のデザイン(figma)、入稿すべて自分で行いオリジナルの名刺を作成した。\nキャラクターを大きく表示して必要な情報のみをまとめること、レイアウトにこだわった。",
  },
  {
    src: "/images/histories/ボカコレアーカイブ.jpg",
    caption: ["ボカコレランキング", "アーカイブの作成"],
    alt: "ボカコレ2023夏ランキングアーカイブのスクリーンショット",
    href: "https://vocaloid-collection-archive.studiognu.org/",
    content:
      "ボカコレ2023夏の毎時ランキングを作成した。\n統計情報や増加量を出すことで様々な角度から情報を整理し、ランキングの傾向を可視化した。\n仮想スクロールを縦横両方に入れており、大量のコンテンツに対して高速に検索、スクロールができるようになっている。\nデータ基盤は cloudflare workers + cloudflare KV + cloudflare R2 を使用し、アプリケーションコードは主に hono で構築されている。\nデータ収集時は cloudflare queue + cloudflare cron trigger を併用することで取りこぼし無くデータを毎時で集計する仕組みを構築している。",
  },
  {
    src: "/images/histories/netuijou-remix.jpg",
    caption: ["熱異常 / シャノン REMIX", "テクニカルサポート"],
    alt: "熱異常 / シャノン REMIXのジャケット",
    href: "https://twitter.com/naporin24690/status/1687483050253561856",
    content: "シャノンさんが REMIX した熱異常のテクニカルサポートをした。主にプログラム周り。",
  },
  {
    src: "/images/histories/napochaan-ogp.png",
    caption: ["napochaan.com", "の作成"],
    alt: "napochaan.comのOGP",
    href: "https://github.com/napolab/www.napochaan.com",
    content:
      "figma を勉強するために作成した。\nNext.js と cloudflare pages を使用して高速な web ページになるように目指し、a11y 対応をするために radix-ui を使用している。\nかわいい感じや楽しい感じを出したかったため、react-spring でひそなさんに描いてもらったキャラクターやコンテンツを動かしている。",
  },
  {
    src: "/images/histories/lgtm-napochaan-com.png",
    caption: ["LGTMジェネレータ"],
    alt: "lgtmの画像",
    href: "https://lgtm.napochaan.com",
    content:
      "satori で作ったものを cloudflare workers にデプロイしている。\n文字色と背景画像を URLParameter で変更することができる。",
  },
  {
    src: "/images/histories/flat-kaitori.png",
    caption: ["買取アプリ", "の開発"],
    alt: "買取先頭アプリのスクリーンショット",
    href: "https://flat-kobo-kaitori.web.app/",
    content:
      "flat-工房の買取専用アプリを開発した。\nデザイン以外の部分をすべて担当しており、firebase, React, vanilla-extract, react-hook-form を使用して作成した。",
  },
  {
    src: "/images/histories/flat-shop.avif",
    caption: ["ネットショップ", "UI 開発"],
    alt: "flatkobo.shop のスクリーンショット",
    href: "https://flatkobo.shop",
    content:
      "flat-工房のネットショップ UI 改善プロジェクトを担当した。\nデザイン以外の部分をすべて担当しており、lit-element を主に使用して開発した。",
  },
  {
    src: "/images/histories/projectblue-hp.jpg",
    caption: ["Project BLUE", "Official HP 作成"],
    alt: "pjblue.jp のスクリーンショット",
    href: "https://pjblue.jp",
    content: "ProjectBLUE の official HP の作成を担当した。Next.js と styled-components を使用している。",
  },
  {
    src: "/images/histories/447pro-tana.avif",
    caption: ["447Records", "TANAの開発"],
    alt: "tana.447pro.com のスクリーンショット",
    href: "https://tana.447pro.com/",
    content:
      "447RecordsTANA の開発を担当した。主にオーディオプレイヤー周りを実装した。\n React で作る複雑な UI に初めて取り組み、AppleMusic のようなインタラクションになるように目指した。",
  },
  {
    src: "/images/histories/soelu-instructors.png",
    caption: ["instructorsページ", "の開発"],
    alt: "soelu.com/instructors のスクリーンショット",
    href: "https://twitter.com/naporin24690/status/1244865712490856448?s=20",
    content: "新卒で入った会社が運営しているアプリのページを1つ作った。",
  },
  {
    src: "/images/histories/soelu-lesson.jpg",
    caption: ["lessonsページ", "の開発"],
    alt: "soelu.com/lessons のスクリーンショット",
    href: "https://twitter.com/naporin24690/status/1227830616227344384",
    content: "インターン先で主要な検索ページを作った。\n検索 UI を初めて実装し、コンポーネント分割の手法などを学んだ。",
  },
  {
    src: "/images/histories/natori-ar.avif",
    caption: ["名取さなさんの", "ファンアプリ作成"],
    alt: "名取さなさんがPCの上に絶っている写真",
    href: "https://twitter.com/naporin24690/status/1106641342506004480",
    content: "桜を見に行くために作った。\niOS で AR を簡単に実現できる web アプリをラップした推し専用のアプリを作った",
  },
  {
    src: "/images/histories/natori-task.jpg",
    caption: ["名取さなさんの", "ファンアプリ作成"],
    alt: "タスクを操作している様子",
    href: "https://twitter.com/naporin24690/status/1091367573587865601",
    content:
      "初めて web アプリケーションを作った。\nタスク管理アプリに推しの声をかけ合わせることで面白い体験を作りだした。",
  },
];

const libraries: Work[] = [
  {
    src: "/images/libraries/npm.png",
    caption: ["y-durableobjects"],
    alt: "npmのロゴ",
    href: "https://www.npmjs.com/package/y-durableobjects",
    content: [
      "Yjs のサーバー実装である y-websocket を DurableObjects で再実装したライブラリ。",
      "Hibernation API を使用して、使用料金を小さく抑えることができるように設計した。",
      "また、Hono の RPC に対応しており hono/hc から $ws で room に接続することができる。",
    ].join(""),
  },
  {
    src: "/images/libraries/npm.png",
    caption: ["alpha-blend"],
    alt: "npmのロゴ",
    href: "https://www.npmjs.com/package/@napolab/alpha-blend",
    content:
      "基本色と半透明な色を合成することができるライブラリ。\n 半透明な色の overlay を absolute の要素なしで実装できることが強み。",
  },
  {
    src: "/images/libraries/npm.png",
    caption: ["kv-response-cache"],
    alt: "npmのロゴ",
    href: "https://www.npmjs.com/package/@napolab/kv-response-cache",
    content:
      "cloudflare workers + hono 用の KV を使ってレスポンスをキャッシュするためのライブラリを作った。\ncustom domain を割り当てられない状況の時に使用することができ、hono middleware を提供しているため、一行で KV Cache を組み込むことができる。",
  },
  {
    src: "/images/libraries/npm.png",
    caption: ["react-flowder"],
    alt: "npmのロゴ",
    href: "https://www.npmjs.com/package/react-flowder",
    content: "RxJS と React の Suspense を組み合わせて、非同期処理を効率よく行うことができるライブラリを作った。",
  },
  {
    src: "/images/libraries/vanilla-extract.png",
    caption: ["vanilla-", "extract-", "inline"],
    alt: "vanilla-extractのOGP",
    href: "https://github.com/napolab/vanilla-extract-inline",
    content:
      "vanilla-extract で書いた css をビルド時にインライン化するためのライブラリを作った。\nメールのテンプレートを作るために使ったり、css を外部ファイルとして使いたくないときに利用できる。",
  },
  {
    src: "/images/libraries/npm.png",
    caption: ["@naporin0624/", "eslint-config"],
    alt: "npmのロゴ",
    href: "https://www.npmjs.com/package/@naporin0624/eslint-config",
    content: "自分がよく使う eslint の設定をまとめたパッケージを作った。",
  },
  {
    src: "/images/libraries/gist.png",
    caption: ["monaco-editor", "type-installer"],
    alt: "gistのOGP",
    href: "https://gist.github.com/naporin0624/2c1c187950738ef4e07a755489ba49de",
    content: "monaco-editor で作ったエディタに型定義をインストールするためのライブラリを作った。",
  },
];
