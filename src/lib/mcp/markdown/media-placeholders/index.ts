import { mapTextSegments, splitCodeFences } from '../code-fences';

// 単一画像プレースホルダ ![media:<id>](alt) の検出・alt 充填・alt 除去。
// すべてコードフェンス外の text セグメントのみを対象にする(image-row セルの
// 括弧は caption、コードフェンス内は例示テキストのため触らない)。

export type MediaPlaceholder = { id: number; alt: string };

// alt に ')' は書けない(regex 上 [^)]* — 括弧を含む alt は表現できない制約)。
const PLACEHOLDER = /!\[media:(\d+)\]\(([^)]*)\)/g;

// フェンス外の全プレースホルダを出現順に列挙(alt は空文字もそのまま返す — 検証は呼び出し側)。
export const findMediaPlaceholders = (markdown: string): MediaPlaceholder[] =>
  splitCodeFences(markdown)
    .filter((segment) => segment.kind === 'text')
    .flatMap((segment) =>
      [...segment.text.matchAll(PLACEHOLDER)].map((match) => ({
        id: parseInt(match[1] ?? '', 10),
        alt: match[2] ?? '',
      })),
    );

// map にある id のプレースホルダの括弧内を alt で置き換える(既存の括弧内は破棄)。
// map にない id は原文のまま。id 表記は raw capture(rawID)をそのまま使う —
// parsed id で再構築すると `![media:007](x)` が `![media:7](...)` に化けてしまう
// (stripMediaPlaceholderAlts と表記保持の挙動を揃える)。
export const fillMediaPlaceholderAlts = (markdown: string, altByID: ReadonlyMap<number, string>): string =>
  mapTextSegments(markdown, (text) =>
    text.replace(PLACEHOLDER, (matched, rawID: string) => {
      const id = parseInt(rawID, 10);
      const alt = altByID.get(id);
      return alt === undefined ? matched : `![media:${rawID}](${alt})`;
    }),
  );

// 全プレースホルダの括弧内を空にする(Payload の import regex ![media:<id>]() は
// 空括弧のみマッチするため、Lexical 変換直前に必ず通す)。
export const stripMediaPlaceholderAlts = (markdown: string): string => mapTextSegments(markdown, (text) => text.replace(PLACEHOLDER, (_matched, rawID: string) => `![media:${rawID}]()`));
