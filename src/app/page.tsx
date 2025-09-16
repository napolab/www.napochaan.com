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
  "Rust",
  "WebAssembly",
  "Haskell",
  "Yjs",
  "Drizzle",
  "Prisma",
  "vercel",
  "firebase",
  "Cloudflare",
];

const histories = [
  {
    src: "/images/histories/pixelartexhibision2.0.png",
    alt: "PAE2.0ドットレカギミック",
    caption: ["PAE2.0", "ドットレカギミック制作"],
    href: "https://vrchat.com/home/world/wrld_ab2c1526-c1b1-419d-b138-be32591e799f",
    content:
      "VRChatで公開されているVRC PIXELART EXHIBITION 2.0にドット絵組み合わせギミックを制作・提供した。\n複数人で同じものを見るための同期機能や、VR・Desktop環境での最適化など、UXを重視した設計を行った。",
  },
  {
    src: "/images/histories/mada-shiranai-kimi.png",
    alt: "「まだ知らない君がいる」MVの撮影シーン",
    caption: ["まだ知らない君がいる", "映像提供"],
    href: "https://x.com/naporin24690/status/1959117309689438582",
    content: "椎乃味醂の楽曲「まだ知らない君がいる - 初音ミク･重音テト」のMVにVRChatで撮影した映像を提供した。",
  },
  {
    src: "/images/histories/vocacolle-2025-summer.png",
    alt: "ボカコレ2025夏ランキングアーカイブのスクリーンショット",
    caption: ["ボカコレ2025夏", "アーカイブ作成"],
    href: "https://vocaloid-collection-archive.studiognu.org/2025/summer",
    content: "ボカコレ2025夏の統計情報をWebサイトにまとめた。",
  },
  {
    src: "/images/histories/ristill-birthday-2025.jpg",
    alt: "おてぃる誕生日モザイクアート",
    caption: ["おてぃる誕生日", "モザイクアート制作"],
    href: "https://ristill.club/2025",
    content:
      "VRChatの推しの誕生日を祝うためにモザイクアートとHPを作成した。\n20人の協力により約3000枚の画像から24000タイルのモザイクアートを制作。モザイクアート生成用のRustツールも開発した。\n可愛らしいデザインとローディング画面にこだわり、提供画像のギャラリーサイトも併設した。個別ページのog:image設定によりTwitterでの共有を促進。\nopennextjs/cloudflareを初めて本格活用したプロダクト。",
  },
  {
    src: "/images/histories/vrchat-event-poster.png",
    alt: "VRChat個人イベントのポスター",
    caption: ["VRChatイベント", "ポスター制作"],
    href: "https://x.com/napochaan_vrc2/status/1929843195313377560",
    content:
      "VRChatの個人イベント用ポスター・ロゴを制作した。\n可愛らしさと情報の伝わりやすさを重視したレイアウトを心がけた。",
  },
  {
    src: "/images/histories/akage-homage.png",
    alt: "AKAGE オマージュ動画のサムネイル",
    caption: ["AKAGEオマージュ", "動画制作"],
    href: "https://x.com/ristill_vr/status/1913064949242360039",
    content:
      "After Effectsを使った初めての動画制作でAKAGEオマージュ動画を作成した。\nアバターのコンセプトに合わせ、可愛さと面白さを重視した編集を心がけた。",
  },
  {
    src: "/images/histories/umanity.jpg",
    alt: "UMANITY HPのスクリーンショット",
    caption: ["UMANITY HP", "制作"],
    href: "https://ahub.jp/umanity/",
    content:
      "AHUBのアルバム「UMANITY」のWebサイトを制作した。\nアルバム紹介コンテンツやクイズなどのインタラクティブなギミックを搭載したHPを作成した。",
  },
  {
    src: "/images/histories/halo-gimmick.png",
    alt: "VRChat で使える好きなものを回せる Halo を作れるギミック",
    href: "https://booth.pm/ja/items/6604904",
    caption: ["ヘイロー化ギミック", "booth 販売"],
    content:
      "VRChatで好きなオブジェクトを頭上で回転させるヘイローにできるギミックを制作した。\nボタン一つで自動配置する仕組みを実装し、フルパック版では13種類のメニューを用意。\n汎用的な円形配置スクリプトにより頭部以外の部位にも装着可能で、アバター対応最適化を行いBOOTHで販売中。",
  },
  {
    src: "/images/histories/WYKMCK.jpeg",
    alt: "展示「W ♭Y ♭K M ♭C K」のシステム作成",
    caption: ["W ♭Y ♭K M ♭C K", "システム作成"],
    href: "https://x.com/naporin24690/status/1867175063893811585",
    content: "企画展「共に在る音楽」の作品「W ♭Y ♭K M ♭C K」のシステムを設計・実装した。",
  },
  {
    src: "/images/histories/DEMiXUS.jpeg",
    alt: "展示「DEMiXUS」のシステム作成",
    caption: ["DEMiXUS", "システム作成"],
    href: "https://x.com/naporin24690/status/1867179943060504598",
    content:
      "企画展「共に在る音楽」の作品「DEMiXUS」のシステムを設計・実装した。\n短期間での開発ながら要望実現のためCloudflare Stackをフル活用した構成とした。",
  },
  {
    src: "/images/histories/tomoshibi.png",
    alt: "燭 Coding & Technical Advisor naporitan",
    caption: ["燭/MusicVideo", "Coding Advisor"],
    href: "https://x.com/naporin24690/status/1845201683368071632",
    content: "燭のMVで使用する図形をp5.jsで生成できるシンプルなエディターを作成した。",
  },
  {
    src: "/images/histories/five-blocker.png",
    alt: "工房祭2024ファイブブロッカーステージ",
    caption: ["工房祭ステージ", "システム実装"],
    href: "https://x.com/naporin24690/status/1834900593808490701",
    content:
      "OBSのブラウザソースで動作するステージ演出システムを作成した。\nCloudflare WorkersとWebSocketによりOBSとスマホ間の通信を実現。自作のdurabcastライブラリを活用。\n演出画面の制御に加え、スマホでの正解不正解選択、再生停止操作、回答者位置調整など現場での実用性を重視した機能を搭載。",
  },
  {
    src: "/images/histories/cloudflare-workers-tech-talk-3.png",
    alt: "Cloudflare Workers Tech Talk#3 のスライド",
    caption: ["Workers Tech Talk#3", "登壇"],
    href: "https://speakerdeck.com/naporin0624/durableobjects-nituite",
    content:
      "Cloudflare Workers DurableObjectsでのWebSocket活用のためのTipsについて登壇した。\nDurableObjectsはWebSocket処理の最適解になりつつあるが、活用にはいくつかの課題がある。\n自身が直面した問題を具体例として挙げながら、実践的な解決策を紹介した。",
  },
  {
    src: "/images/histories/hono-conference-2024.png",
    alt: "Hono Conference2024 登壇の写真",
    caption: ["Hono Conf 2024", "登壇"],
    href: "https://speakerdeck.com/naporin0624/event-exhibition-with-hono",
    content:
      "Hono Conference 2024 - Our first stepに登壇した。\n大阪関西国際芸術祭での展示システム事例について発表。イベント向け短期開発でのCloudflare活用メリットとHono併用による効率化について説明。\n具体的にはHono RPCでの型安全通信、ReverseProxyとgetPathを併用した画像最適化サーバーの構築手法などを紹介した。",
  },
  {
    src: "/images/histories/flatkobo-hp.png",
    alt: "flat-工房 HP のスクリーンショット",
    caption: ["flat-工房 HP", "制作サポート"],
    href: "https://www.flatkobo.com",
    content:
      "flat-工房のHP制作サポートを行った。\nNext.jsをCloudflare Pagesで運用し、画像最適化にはCloudflare WorkerとCloudflare Imagesを活用。\nコンタクトフォームはServerActionとResendで実装し、bot対策としてCloudflare WAFページ検証を導入するなど安全な運用を重視した。",
  },
  {
    src: "/images/histories/kanata.png",
    alt: "KANATA LP のスクリーンショット",
    caption: ["彼方 DL ページ作成"],
    href: "https://www.studiognu.org/lp/kanata",
    content:
      "StudioGnuで公開したUTAU彼方のランディングページを作成した。\n利用規約の必読を重視し、ダウンロード機能の実装に注力。\nCloudflare Turnstileでbot排除後、数分間有効なsigned URLでダウンロードリンクを生成。DurableObjectsによるダウンロードカウンター機能も搭載し、総ダウンロード数を確認可能。",
  },
  {
    src: "/images/histories/vocacolle-2024.png",
    alt: "ボカコレ2024冬のランキング",
    caption: ["ボカコレ2024冬", "ランキングの作成"],
    href: "https://vocaloid-collection-archive.studiognu.org/2024/winter",
    content:
      "ボカコレ2024冬のランキングアーカイブを作成した。\nフロントエンドは前回から変更なしだが、サーバー実装を大幅強化。\nCloudflare Cron Triggerで収集したランキングスナップショットをdrizzleでCloudflare D1に保存する構成に変更した。",
  },
  {
    src: "/images/histories/www.studiognu.org_ja.png",
    alt: "StudioGnu HP のスクリーンショット",
    caption: ["StudioGnu HP", "の作成"],
    href: "https://www.studiognu.org",
    content:
      "StudioGnuのHPを作成した。\nNext.jsとvanilla-extractをメインに使用し、データ管理にはMicroCMSを採用。Interweaveライブラリで文字列をHTML変換している。\n作品ごとの動的og:image生成にはnext/ogを活用した。",
  },
  {
    src: "/images/histories/duree.jpg",
    alt: "楽曲「デュレエ」関連データ解析セクションのスクリーンショット",
    caption: ["楽曲「デュレエ」", "関連データ解析"],
    href: "https://www.youtube.com/watch?v=dpT-ZAPVvyI",
    content:
      "楽曲「デュレエ」の一部で使用されるデータの解析を担当した。\nデータ分析にJupyterLab、pandas、numpyを使用し、描画にmatplotlib、NetWorkX、JavaScript canvasを活用。\nサムネイル変遷の大量データはmatplotlibでは処理できず、canvasで実装。適切なアウトプットのため言語に固執しない柔軟なアプローチを取った。",
  },
  {
    src: "/images/histories/OKIAF.png",
    alt: "大阪関西国際芸術祭2023に出展したシステム図",
    caption: ["「多面体、鏡面」", "システム作成"],
    href: "https://x.com/StudioGnu/status/1741010587495416144?s=20",
    content:
      "大阪関西国際芸術祭2023に出展するためのシステムを作成した。\n感想投稿機能、ChatGPT APIとStableDiffusionによる自動動画生成システム、ポスター・コメント表示画面を実装。\n技術的挑戦として大部分をCloudflare製品で構築した。",
  },
  {
    src: "/images/histories/1st-album.hakualab.org.png",
    alt: "シャノン 1st アルバム LP",
    caption: ["第一象徴体系 LP 作成"],
    href: "https://1st-album.hakualab.org/",
    content: "シャノンの1stアルバムのランディングページを作成した。\nFigmaでデザインし、Astroで実装した。",
  },
  {
    src: "/images/histories/meishi-v1.jpg",
    caption: ["オリジナル名刺", "の作成"],
    alt: "naporitan の名刺",
    href: "https://x.com/naporin24690/status/1705577231928697299",
    content:
      "オリジナル名刺を作成した。\nFigmaでデザインから入稿まですべて自力で実施。キャラクターをメインにしたシンプルで情報が伝わりやすいレイアウトにこだわった。",
  },
  {
    src: "/images/histories/vocacolle-2023.jpg",
    caption: ["ボカコレランキング", "アーカイブの作成"],
    alt: "ボカコレ2023夏ランキングアーカイブのスクリーンショット",
    href: "https://vocaloid-collection-archive.studiognu.org/",
    content:
      "ボカコレ2023夏の毎時ランキングアーカイブを作成した。\n統計情報や増加量を多角的に整理し、ランキング傾向を可視化。縦横両方向の仮想スクロールで大量コンテンツの高速検索・スクロールを実現。\nデータ基盤はCloudflare Workers + KV + R2、アプリケーションはHonoで構築。データ収集はqueue + cron triggerの組み合わせで取りこぼしなく毎時集計する仕組みを構築。",
  },
  {
    src: "/images/histories/netuijou-remix.jpg",
    caption: ["熱異常 / シャノン REMIX", "テクニカルサポート"],
    alt: "熱異常 / シャノン REMIXのジャケット",
    href: "https://twitter.com/naporin24690/status/1687483050253561856",
    content: "シャノンの熱異常REMIXのテクニカルサポートを担当した。主にプログラム部分をサポート。",
  },
  {
    src: "/images/histories/napochaan-ogp.png",
    caption: ["napochaan.com", "の作成"],
    alt: "napochaan.comのOGP",
    href: "https://github.com/napolab/www.napochaan.com",
    content:
      "Figmaの勉強を兼ねて作成したポートフォリオサイト。\nNext.js + Cloudflare Pagesで高速表示を実現し、アクセシビリティ対応にRadix UIを採用。\n可愛らしさと楽しさを表現するため、react-springでキャラクターやコンテンツにアニメーションを付与。",
  },
  {
    src: "/images/histories/lgtm-napochaan-com.png",
    caption: ["LGTMジェネレータ"],
    alt: "lgtmの画像",
    href: "https://lgtm.napochaan.com",
    content:
      "satoriで作成したLGTMジェネレーターをCloudflare Workersにデプロイ。\nURLパラメーターで文字色と背景画像をカスタマイズ可能。",
  },
  {
    src: "/images/histories/flat-kaitori.png",
    caption: ["買取アプリ", "の開発"],
    alt: "買取先頭アプリのスクリーンショット",
    href: "https://flat-kobo-kaitori.web.app/",
    content:
      "flat-工房の買取専用アプリを開発した。\nデザイン以外の全部分を担当し、Firebase + React + vanilla-extract + react-hook-formで構築。",
  },
  {
    src: "/images/histories/flat-shop.jpg",
    caption: ["ネットショップ", "UI 開発"],
    alt: "flatkobo.shop のスクリーンショット",
    href: "https://flatkobo.shop",
    content:
      "flat-工房のネットショップUI改善プロジェクトを担当。\nデザイン以外の全部分を担当し、lit-elementをメインに使用して開発。",
  },
  {
    src: "/images/histories/projectblue-hp.png",
    caption: ["Project BLUE", "Official HP 作成"],
    alt: "pjblue.jp のスクリーンショット",
    href: "https://pjblue.jp",
    content: "ProjectBLUEの公式HPを作成した。Next.js + styled-componentsで構築。",
  },
  {
    src: "/images/histories/447pro-tana.jpg",
    caption: ["447Records", "TANAの開発"],
    alt: "tana.447pro.com のスクリーンショット",
    href: "https://tana.447pro.com/",
    content:
      "447Records TANAの開発を担当した。主にオーディオプレイヤー周りを実装。\nReactでの複雑UI実装に初めて挑戦し、Apple Musicのような洗練されたインタラクションを目指した。",
  },
  {
    src: "/images/histories/soelu-instructor.png",
    caption: ["instructorsページ", "の開発"],
    alt: "soelu.com/instructors のスクリーンショット",
    href: "https://twitter.com/naporin24690/status/1244865712490856448?s=20",
    content: "新卒で入社した会社のアプリページを作成した。",
  },
  {
    src: "/images/histories/soelu-lesson.jpg",
    caption: ["lessonsページ", "の開発"],
    alt: "soelu.com/lessons のスクリーンショット",
    href: "https://twitter.com/naporin24690/status/1227830616227344384",
    content: "インターン先で主要な検索ページを作成した。\n検索UIの初実装を通じてコンポーネント分割の手法を学んだ。",
  },
  {
    src: "/images/histories/natori-ar.jpg",
    caption: ["名取さなさんの", "ファンアプリ作成"],
    alt: "名取さなさんがPCの上に絶っている写真",
    href: "https://twitter.com/naporin24690/status/1106641342506004480",
    content: "桜を見に行くために作成したファンアプリ。\niOSでARを簡単に実現できるwebアプリをラップした推し専用アプリ。",
  },
  {
    src: "/images/histories/natori-task.jpg",
    caption: ["名取さなさんの", "ファンアプリ作成"],
    alt: "タスクを操作している様子",
    href: "https://twitter.com/naporin24690/status/1091367573587865601",
    content:
      "初めて作成したwebアプリケーション。\nタスク管理アプリに推しの声をかけ合わせることで、ユニークで面白い体験を作り出した。",
  },
] satisfies ComponentProps<typeof WorkItem>[];

const libraries = [
  {
    src: "/images/libraries/mosaic-art-rust.png",
    caption: ["mosaic-art-rust"],
    alt: "mosaic-art-rustのロゴ",
    href: "https://naporin0624.github.io/mosaic-art-rust/",
    content: [
      "Rust で実装した高性能なモザイクアートジェネレーターを作った。",
      "知覚的な色空間（Lab色空間）での色マッチング、並列処理、シミュレーテッドアニーリング最適化を使用して驚くべきモザイク画像を作成できる。",
      "デュアルインターフェース（GUI/CLI）とクロスプラットフォームに対応。",
    ].join(""),
  },
  {
    src: "/images/libraries/pixel-art-rust.png",
    caption: ["pixel-art-rust"],
    alt: "pixel-art-rustのロゴ",
    href: "https://naporin0624.github.io/pixel-art-rust/",
    content: [
      "Rust で実装した高性能なピクセルアート変換ツールを作った。",
      "複数のカラー量子化アルゴリズム（平均、メディアンカット、K-means、適応型クアッドツリー）をサポートし、Rayonによる並列処理で高速動作する。",
      "LABカラースペースを使用した知覚的に均一な色変換を実現。",
    ].join(""),
  },
  {
    src: "/images/libraries/gpt-image-1-mcp.png",
    caption: ["gpt-image-1-mcp"],
    alt: "gpt-image-1-mcpのロゴ",
    href: "https://naporin0624.github.io/gpt-image-1-mcp/",
    content: [
      "OpenAI の gpt-image-1 モデルを使用した MCP サーバーを作った。",
      "高度なテキストレンダリング、透過サポート、複数フォーマット出力（PNG、JPEG、WebP）、バッチ画像編集機能を搭載。",
      "AI を活用した高品質で柔軟な画像生成と編集ができる。",
    ].join(""),
  },
  {
    src: "/images/libraries/eslint-rules.png",
    caption: ["@napolab/", "eslint-rules"],
    alt: "@napolab/eslint-rulesのロゴ",
    href: "https://github.com/napolab/eslint-rules",
    content: [
      "Next.js と Vanilla Extract プロジェクトのスタイリング規約を強制する ESLint プラグインを作った。",
      "コンポーネントファイルのスタイルインポート強制、命名規則の定義、スタイル名の複雑さ制限を実施。",
      "テスト駆動開発（TDD）アプローチを採用し、コードの品質と可読性を向上させている。",
    ].join(""),
  },
  {
    src: "/images/libraries/durabcast.png",
    caption: ["durabcast"],
    alt: "durabcastのロゴ",
    href: "https://www.npmjs.com/package/durabcast",
    content: [
      "DurableObjects で WebSocket を扱うためのライブラリ。",
      "自動接続チェックや、メッセージの送信機能などが搭載されている基底クラスとなっている。このライブラリを拡張することで煩雑な設定なしに DurableObjects で WebSocket を扱うことが可能になる。",
    ].join(""),
  },
  {
    src: "/images/libraries/y-durableobjects.png",
    caption: ["y-durableobjects"],
    alt: "y-durableobjectsのロゴ",
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
    src: "/images/libraries/kv-response-cache.png",
    caption: ["kv-response-cache"],
    alt: "kv-response-cacheのロゴ",
    href: "https://www.npmjs.com/package/@napolab/kv-response-cache",
    content:
      "Cloudflare workers + hono 用の KV を使ってレスポンスをキャッシュするためのライブラリを作った。\ncustom domain を割り当てられない状況の時に使用することができ、hono middleware を提供しているため、一行で KV Cache を組み込むことができる。",
  },
  {
    src: "/images/libraries/react-flowder.png",
    caption: ["react-flowder"],
    alt: "react-flowderのロゴ",
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
    src: "/images/libraries/eslint-config.png",
    caption: ["@naporin0624/", "eslint-config"],
    alt: "@naporin0624/eslint-configのロゴ",
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
