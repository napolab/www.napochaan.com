import ObjectID from 'bson-objectid';

import { runPlugins } from '@utils/run-plugins';

import type { Plugin } from '@utils/run-plugins';
import type { Blog } from '@payload-types';

// 「単独リンク行 → 埋め込み block」の汎用 lexical tree 変換。
// convertMarkdownToLexical 後の tree を走査し、「リンク 1 つだけの root 直下の段落」を
// StandaloneLink に正規化して provider registry(prefix-match-processor 形式、
// first-match)にディスパッチする。どの動画サービスの URL か・block field をどう組むかは
// 各 provider(例: src/blocks/youtube-embed/embed-provider)の責務で、この層は
// サービス固有の型を一切 import しない。サービス追加は provider 1 つ +
// McpBlockSupport への登録 1 行(open/closed — tree walk とディスパッチは変わらない)。
//
// 置き換え対象(qualifying paragraph)= root 直下の paragraph で、whitespace-only の
// text node を除いた子がちょうど次のいずれか 1 つ:
//   - link / autolink node: fields.url を持つ。caption = text 子の連結を trim +
//     アンエスケープしたもの。テキストが URL 自身と一致する(editor の autolink 相当)か
//     空なら caption なし('')。
//   - text node: trim した本文全体を URL 候補とする。caption なし('')。
// StandaloneLink に正規化できても provider が全滅(err)なら一切触らない —
// 拒否ではなく素通し(文中のインラインリンク・code node・quote/list 内の段落も同様)。

type LexicalBody = Blog['body'];
type LexicalNode = LexicalBody['root']['children'][number];

// 段落から取り出した「単独リンク」の正規形。caption は無いとき ''(undefined ではなく
// 空文字で単一表現に潰す — provider 側の場合分けを 1 つにする)。
export type StandaloneLink = { url: string; caption: string };

// provider が返す block field の最小構造型。blockType 以外の field 構成は provider
// ごとに異なるため index signature で受け、この層は id を採番して被せるだけ。
export type LinkEmbedFields = { blockType: string; [field: string]: unknown };

// 動画サービス provider の契約(prefix-match-processor 形式)。自サービスの URL なら
// ok(block fields)、そうでなければ err(link) を返す(null/boolean/throw は禁止)。
export type LinkEmbedProvider = Plugin<StandaloneLink, LinkEmbedFields>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// text node の text を取り出す(text node 以外・text 欠落は undefined)。
const textOf = (node: unknown): string | undefined => {
  if (!isRecord(node)) return undefined;
  if (node.type !== 'text') return undefined;

  return typeof node.text === 'string' ? node.text : undefined;
};

// 行頭スペース等は paragraph 内に whitespace-only text node として残る(実測)ため、
// qualifying 判定ではこれらの兄弟を無視する。
const isWhitespaceText = (node: unknown): boolean => {
  const text = textOf(node);

  return text !== undefined && text.trim() === '';
};

// export 側 formatter(例: youtube-embed/markdown-format の escapeCaption)が caption の
// [ ] を CommonMark として \[ \] にエスケープする一方、lexical の Markdown importer は
// バックスラッシュを解釈せず文字通り残す(link-embed.test.ts の characterization が固定)。
// その復元はどのサービスでも同じなので、provider に渡す前にこの層で行う。
export const unescapeLinkCaption = (caption: string): string => caption.replace(/\\([[\]])/g, '$1');

// link / autolink node → StandaloneLink 候補。fields.url が無い(内部 doc リンク等)は
// undefined(素通し)。
const linkFromLinkNode = (node: Record<string, unknown>): StandaloneLink | undefined => {
  const fields = isRecord(node.fields) ? node.fields : undefined;
  const url = typeof fields?.url === 'string' ? fields.url : undefined;
  if (url === undefined) return undefined;

  const children = Array.isArray(node.children) ? node.children : [];
  const caption = unescapeLinkCaption(children.map((child) => textOf(child) ?? '').join('')).trim();
  if (caption === url) return { url, caption: '' };

  return { url, caption };
};

// text node → StandaloneLink 候補。trim した本文全体を URL 候補として provider に委ねる
// (URL として解釈できるかはサービス依存なので、この層では判定しない)。
const linkFromTextNode = (node: unknown): StandaloneLink | undefined => {
  const text = textOf(node);
  if (text === undefined) return undefined;

  return { url: text.trim(), caption: '' };
};

// root 直下の 1 node を判定する。qualifying paragraph でなければ undefined。
const extractStandaloneLink = (node: LexicalNode): StandaloneLink | undefined => {
  if (node.type !== 'paragraph') return undefined;

  const children = Array.isArray(node.children) ? node.children : [];
  const significant = children.filter((child) => !isWhitespaceText(child));
  if (significant.length !== 1) return undefined;

  const [only] = significant;
  if (!isRecord(only)) return undefined;
  if (only.type === 'link' || only.type === 'autolink') return linkFromLinkNode(only);

  return linkFromTextNode(only);
};

export type GenerateBlockID = () => string;

// 旧 youtube-embed 内部フェンス経路では Payload の $createServerBlockNode が
// fields.id に bson-objectid の hex を採番していた。同種の id を既定で採番する
// (純粋性の都合で generator は注入依存にし、テストは決定的なものを渡す)。
const defaultGenerateID: GenerateBlockID = () => new ObjectID().toHexString();

// 旧フェンス import($importMultiline)が生成していた block node と同形:
// { type: 'block', version: 2, format: '', fields: { blockType, ..., id } }。
// field 構成(caption 省略等)は provider が返した fields をそのまま採用する。
const toBlockNode = (fields: LinkEmbedFields, generateID: GenerateBlockID): LexicalNode => ({
  type: 'block',
  version: 2,
  format: '',
  fields: { ...fields, id: generateID() },
});

// providers を登録順に first-match で試す transform を組む。ok → provider の fields +
// 採番 id で block node に置き換え、全滅(err)→ 段落を参照のまま残す。
// 入力 tree は変更しない(置き換えは新配列で返す)。
export const createLinkEmbedTransform =
  (providers: readonly LinkEmbedProvider[], generateID: GenerateBlockID = defaultGenerateID) =>
  (body: LexicalBody): LexicalBody => ({
    ...body,
    root: {
      ...body.root,
      children: body.root.children.map((node) => {
        const link = extractStandaloneLink(node);
        if (link === undefined) return node;

        return runPlugins(link, providers).match(
          (fields) => toBlockNode(fields, generateID),
          () => node,
        );
      }),
    },
  });
