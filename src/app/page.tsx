import dayjs from "dayjs";
import { Suspense, lazy } from "react";

import { getSizuArticles, getZennArticles } from "@adapters/rss";
import Section from "@components/section";

import { Background } from "./_components/page/background";
import { Contact } from "./_components/page/contact";
import { FirstView } from "./_components/page/first-view";
import { WorkItem } from "./_components/page/work-item";
import { Works } from "./_components/page/works";
import * as styles from "./styles.css";

import type { ComponentProps } from "react";

const Budoux = lazy(() => import("@components/budoux"));

export const runtime = "edge";

const Page = async () => {
  const historiesItems = histories.map((item, idx) => ({
    key: `histories__${item.src}-${idx}`,
    children: (
      <WorkItem
        {...item}
        content={
          <Suspense fallback={<span>{item.content}</span>}>
            <Budoux>{item.content}</Budoux>
          </Suspense>
        }
      />
    ),
  }));

  const libraryItems = libraries.map((item, idx) => ({
    key: `library__${item.src}-${idx}`,
    children: (
      <WorkItem
        {...item}
        content={
          <Suspense fallback={<span>{item.content}</span>}>
            <Budoux>{item.content}</Budoux>
          </Suspense>
        }
      />
    ),
  }));

  const zenn = await getZennArticles();
  const sizume = await getSizuArticles();
  const articles = [...zenn, ...sizume]
    .map((x) => ({ ...x, pubDate: dayjs(x.pubDate) }))
    .sort((a, b) => b.pubDate.unix() - a.pubDate.unix());

  const articleItems = articles.map((item) => ({
    key: `article__${item.link}`,
    children: (
      <WorkItem
        src={item.enclosure?.["@_url"] ?? ""}
        caption={item.title}
        alt={`${item.title} のサムネイル`}
        href={item.link}
        description={dayjs(item.pubDate).format("YYYY-MM-DD")}
        content={<span className={styles.workDialogContent}>{item.description.trimStart()}</span>}
      />
    ),
  }));

  return (
    <Section className={styles.pageRoot}>
      <Background />
      <FirstView tags={techTags} />
      <Works histories={historiesItems} libraries={libraryItems} articles={articleItems} />
      <Contact />
    </Section>
  );
};

export default Page;

const techTags: string[] = [
  "TypeScript",
  "React",
  "CSS",
  "vanilla-extract",
  "Next.js",
  "Remix",
  "Hono",
  "NestJS",
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
  "C#",
  "UdonSharp",
  "Unity",
  "vercel",
  "firebase",
  "Cloudflare",
];

const histories = [
  {
    src: "/images/histories/halo-gimmick.png",
    alt: "VRChat で使える好きなものを回せる Halo を作れるギミック",
    href: "https://booth.pm/ja/items/6604904",
    caption: ["ヘイロー化ギミック", "booth 販売"],
    content: [
      "VRChatで好きなオブジェクトを頭上で回転させるヘイローにできるギミックを作成した。",
      "ボタン一つで配置したオブジェクトを円形に自動配置できる仕組みを実装し、フルパック版では13種類のメニューを用意した。",
      "どんなものでも円形に配置するスクリプトが同梱されているので、頭だけでなく腕や腰にもつけることが可能。",
      "avatarで使用可能なように最適化し、BOOTHで販売している。",
    ].join("\n"),
  },
  {
    src: "/images/histories/WYKMCK.jpeg",
    alt: "展示「W ♭Y ♭K M ♭C K」のシステム作成",
    caption: ["W ♭Y ♭K M ♭C K", "システム作成"],
    href: "https://x.com/naporin24690/status/1867175063893811585",
    content: ["企画展「共に在る音楽」の作品である「W ♭Y ♭K M ♭C K」のシステムの設計・実装を行った。"].join("\n"),
  },
  {
    src: "/images/histories/DEMiXUS.jpeg",
    alt: "展示「DEMiXUS」のシステム作成",
    caption: ["DEMiXUS", "システム作成"],
    href: "https://x.com/naporin24690/status/1867179943060504598",
    content: [
      "企画展「共に在る音楽」の作品である「DEMiXUS」のシステムの設計・実装を行った。",
      "短期間の実装であったが要望を実現すべく Cloudflare Stack をフル活用した内容になっている。",
    ].join("\n"),
  },
  {
    src: "/images/histories/tomoshibi.png",
    alt: "燭 Coding & Technical Advisor naporitan",
    caption: ["燭/MusicVideo", "Coding Advisor"],
    href: "https://x.com/naporin24690/status/1845201683368071632",
    content: ["燭の MV で使われる図形を p5.js で生成できる簡単なエディターを作った。"].join("\n"),
  },
  {
    src: "/images/histories/five-blocker.png",
    alt: "工房祭2024ファイブブロッカーステージ",
    caption: ["工房祭ステージ", "システム実装"],
    href: "https://x.com/naporin24690/status/1834900593808490701",
    content: [
      "OBSのブラウザソースで動作するステージ演出システムを作成した。",
      "Cloudflare WorkersでWebSocketを使い、OBSとスマホの通信を行っており、自身で作成したdurabcastを用いている。",
      "演出画面に加え、スマホで正解不正解の選択や再生停止の操作、回答者の位置調整もできるようになっており、現場での使用に耐えられる工夫をしている。",
    ].join("\n"),
  },
  {
    src: "/images/histories/cloudflare-workers-tech-talk-3.png",
    alt: "Cloudflare Workers Tech Talk#3 のスライド",
    caption: ["Workers Tech Talk#3", "登壇"],
    href: "https://speakerdeck.com/naporin0624/durableobjects-nituite",
    content: [
      "Cloudflare Workers DurableObjects で WebSocket を取り扱うための Tips について話した。",
      "DurableObjects は WebSocket を扱うための最適な選択肢になりつつあるが、うまく使用するためには障壁がいくつかある。",
      "自分が直面した問題を例に挙げながら解決策を紹介した。",
    ].join("\n"),
  },
  {
    src: "/images/histories/hono-conference-2024.png",
    alt: "Hono Conference2024 登壇の写真",
    caption: ["Hono Conf 2024", "登壇"],
    href: "https://speakerdeck.com/naporin0624/event-exhibition-with-hono",
    content: [
      "Hono Conference 2024 - Our first step に登壇した。",
      "大阪関西国際芸術祭というイベントで展示したインタラクティブビデオシステムでの事例について発表を行った。",
      "イベントのような短期開発では Cloudflare を使用するメリットを説明し、Hono と併用することでより効率的に開発したことを話した。",
      "具体的には、Hono RPC での型安全な通信、 ReverseProxy と getPath を併用した画像最適サーバーの作成のやり方などを紹介した。",
    ].join("\n"),
  },
  {
    src: "/images/histories/flatkobo-hp.png",
    alt: "flat-工房 HP のスクリーンショット",
    caption: ["flat-工房 HP", "制作サポート"],
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
    caption: ["彼方 DL ページ作成"],
    href: "https://www.studiognu.org/lp/kanata",
    content: [
      "StudioGnu で公開した UTAU 彼方の LP を作成した。",
      "利用規約を必ず読んでほしいという要望があったため、特にダウンロードの実装に力を入れている。",
      "Cloudflare Turnstile で bot を排除した後に数分間だけ有効な signed URL がダウンロードリンクになっている。",
      "またダウンロードリンクには DurableObjects で作られたダウンロードカウンターが搭載されており、総ダウンロード数が確認可能。",
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
      "大阪関西国際芸術祭2023に出展するためのシステムを作成した。\n感想投稿、ChatGPT API と StableDiffusion による自動動画生成の仕組みを作成、ポスター、投稿コメント表示画面の実装を行った。大部分を Cloudflare の製品で作るという技術的にも挑戦的なことを行った。",
  },
  {
    src: "/images/histories/1st-album.hakualab.org.png",
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
    src: "/images/histories/vocacolle-2023.jpg",
    caption: ["ボカコレランキング", "アーカイブの作成"],
    alt: "ボカコレ2023夏ランキングアーカイブのスクリーンショット",
    href: "https://vocaloid-collection-archive.studiognu.org/",
    content:
      "ボカコレ2023夏の毎時ランキングを作成した。\n統計情報や増加量を出すことで様々な角度から情報を整理し、ランキングの傾向を可視化した。\n仮想スクロールを縦横両方に入れており、大量のコンテンツに対して高速に検索、スクロールができるようになっている。\nデータ基盤は Cloudflare workers + Cloudflare KV + Cloudflare R2 を使用し、アプリケーションコードは主に hono で構築されている。\nデータ収集時は Cloudflare queue + Cloudflare cron trigger を併用することで取りこぼし無くデータを毎時で集計する仕組みを構築している。",
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
      "figma を勉強するために作成した。\nNext.js と Cloudflare pages を使用して高速な web ページになるように目指し、a11y 対応をするために radix-ui を使用している。\nかわいい感じや楽しい感じを出したかったため、react-spring でひそなさんに描いてもらったキャラクターやコンテンツを動かしている。",
  },
  {
    src: "/images/histories/lgtm-napochaan-com.png",
    caption: ["LGTMジェネレータ"],
    alt: "lgtmの画像",
    href: "https://lgtm.napochaan.com",
    content:
      "satori で作ったものを Cloudflare workers にデプロイしている。\n文字色と背景画像を URLParameter で変更することができる。",
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
    src: "/images/histories/flat-shop.jpg",
    caption: ["ネットショップ", "UI 開発"],
    alt: "flatkobo.shop のスクリーンショット",
    href: "https://flatkobo.shop",
    content:
      "flat-工房のネットショップ UI 改善プロジェクトを担当した。\nデザイン以外の部分をすべて担当しており、lit-element を主に使用して開発した。",
  },
  {
    src: "/images/histories/projectblue-hp.png",
    caption: ["Project BLUE", "Official HP 作成"],
    alt: "pjblue.jp のスクリーンショット",
    href: "https://pjblue.jp",
    content: "ProjectBLUE の official HP の作成を担当した。Next.js と styled-components を使用している。",
  },
  {
    src: "/images/histories/447pro-tana.jpg",
    caption: ["447Records", "TANAの開発"],
    alt: "tana.447pro.com のスクリーンショット",
    href: "https://tana.447pro.com/",
    content:
      "447RecordsTANA の開発を担当した。主にオーディオプレイヤー周りを実装した。\n React で作る複雑な UI に初めて取り組み、AppleMusic のようなインタラクションになるように目指した。",
  },
  {
    src: "/images/histories/soelu-instructor.png",
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
    src: "/images/histories/natori-ar.jpg",
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
] satisfies ComponentProps<typeof WorkItem>[];

const libraries = [
  {
    src: "/images/libraries/npm.png",
    caption: ["durabcast"],
    alt: "npmのロゴ",
    href: "https://www.npmjs.com/package/durabcast",
    content: [
      "DurableObjects で WebSocket を扱うためのライブラリ。",
      "自動接続チェックや、メッセージの送信機能などが搭載されている基底クラスとなっている。このライブラリを拡張することで煩雑な設定なしに DurableObjects で WebSocket を扱うことが可能になる。",
    ].join(""),
  },
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
    src: "/images/libraries/alpha-blend.png",
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
      "Cloudflare workers + hono 用の KV を使ってレスポンスをキャッシュするためのライブラリを作った。\ncustom domain を割り当てられない状況の時に使用することができ、hono middleware を提供しているため、一行で KV Cache を組み込むことができる。",
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
] satisfies ComponentProps<typeof WorkItem>[];
