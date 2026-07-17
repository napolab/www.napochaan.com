import { FENCE_START, MEDIA_LINE, POSTER_REF, VIDEO_FENCE, fenceBodyLines } from '../fence';

import type { McpBlockSupport } from '@lib/mcp/markdown/block-support';

// video フェンスを丸ごと除去した Markdown を返す。image-row と同じ理由: フェンス内の
// ![media:<id>](caption) は video フェンス内でのみ有効な構文なので、フェンスを除去した
// 残りを生URL画像参照スキャンにかければフェンス外の誤用だけが対象になる。
const stripFences = (markdown: string): string => markdown.replace(VIDEO_FENCE, '');

// 開始行(match[0] の1行目)の unquoted props 文字列を取り出す。VIDEO_FENCE の group1
// は本文行そのものなので、props は match[0] から改めて1行目だけを切り出して
// FENCE_START に通す。
const propsOf = (fenceText: string): string => (fenceText.split('\n', 1)[0] ?? '').match(FENCE_START)?.[1] ?? '';

// 開始行の unquoted `key=value` 属性列(空白区切り)から指定 key の値を取り出す。
// Payload 側の extractPropsFromJSXPropsString と同じ「空白区切りの key=value」を
// MCP 側の検証用に素朴にパースするだけで、fence の構文そのものを表す正規表現
// (FENCE_START/MEDIA_LINE/POSTER_REF)は一切再定義しない。
const attrValue = (props: string, key: string): string | undefined =>
  props
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token): [string, string | undefined] => {
      const [tokenKey, ...rest] = token.split('=');
      return [tokenKey ?? '', rest.length > 0 ? rest.join('=') : undefined];
    })
    .find(([tokenKey]) => tokenKey === key)?.[1];

const isValidVariant = (value: string): boolean => value === 'ambient' || value === 'player';

// body(フェンス内テキスト)がちょうど1行の有効な media 行であれば、その id を返す。
const bodyMediaIDOf = (body: string): number | undefined => {
  const lines = fenceBodyLines(body);
  if (lines.length !== 1) return undefined;
  const [line] = lines;
  if (line === undefined) return undefined;

  const match = line.match(MEDIA_LINE);
  if (match === null) return undefined;

  const id = parseInt(match[1] ?? '', 10);
  return Number.isNaN(id) ? undefined : id;
};

// 開始行の poster=media:<id> 属性から id を取り出す(variant を問わず、構文として
// 存在すれば常に対象 — 存在チェックは validateFences の意味検証とは別の関心事)。
const posterIDOf = (props: string): number | undefined => {
  const raw = attrValue(props, 'poster');
  if (raw === undefined) return undefined;

  const match = raw.match(POSTER_REF);
  if (match === null) return undefined;

  const id = parseInt(match[1] ?? '', 10);
  return Number.isNaN(id) ? undefined : id;
};

// 1つのフェンスに対する検証チェック。エラーがなければ undefined を返す小関数の集まりを
// 合成する(image-row 同様、if/elseチェーンではなく検証チェーンを関数合成で組む)。
type FenceCheck = (fenceText: string, body: string, props: string, variant: string | undefined) => string | undefined;

const checkBody: FenceCheck = (fenceText, body) =>
  bodyMediaIDOf(body) === undefined ? `video フェンスは ![media:<id>](caption) をちょうど1行含む必要があります(動画1本固定)。caption は省略可(![media:<id>]())。該当:\n${fenceText}` : undefined;

const checkVariant: FenceCheck = (fenceText, _body, _props, variant) =>
  variant !== undefined && !isValidVariant(variant) ? `video フェンスの variant は ambient か player のいずれかである必要があります(不正な値: ${variant})。該当:\n${fenceText}` : undefined;

const checkPoster: FenceCheck = (fenceText, _body, props, variant) =>
  attrValue(props, 'poster') !== undefined && variant !== 'player'
    ? `video フェンスの poster は variant=player の時のみ指定できます(現在: ${variant ?? 'ambient(省略時のデフォルト)'})。ambient/player以外の値や省略時は無視されます。該当:\n${fenceText}`
    : undefined;

const checkPosterFormat: FenceCheck = (fenceText, _body, props) => {
  const raw = attrValue(props, 'poster');
  if (raw === undefined) return undefined;

  return POSTER_REF.test(raw) ? undefined : `video フェンスの poster は media:<id> の形式である必要があります(不正な値: ${raw})。該当:\n${fenceText}`;
};

const CHECKS: readonly FenceCheck[] = [checkBody, checkVariant, checkPoster, checkPosterFormat];

// 各 video フェンスに CHECKS を適用し、違反ごとの LLM 向け回復指示を返す。
const validateFences = (markdown: string): string[] =>
  [...markdown.matchAll(VIDEO_FENCE)].flatMap((match) => {
    const fenceText = match[0];
    const body = match[1] ?? '';
    const props = propsOf(fenceText);
    const variant = attrValue(props, 'variant');

    return CHECKS.map((check) => check(fenceText, body, props, variant)).filter((error): error is string => error !== undefined);
  });

// 全 video フェンスが参照する media id を列挙(存在チェック用)。body の動画1本に加え、
// 開始行に poster=media:<id> があればそれも含める(MCP 側で poster の存在も検証するため)。
const extractMediaIDs = (markdown: string): number[] =>
  [...markdown.matchAll(VIDEO_FENCE)].flatMap((match) => {
    const fenceText = match[0];
    const body = match[1] ?? '';
    const props = propsOf(fenceText);
    const videoID = bodyMediaIDOf(body);
    const posterID = posterIDOf(props);

    return [videoID, posterID].filter((id): id is number => id !== undefined);
  });

// LLM 向けの構文説明。tool の bodyMarkdown 説明に集約される。
const syntaxHelp = [
  '動画を1本埋め込む video block(標準 Markdown ではない):',
  '```video variant=<ambient|player>[ poster=media:<id>] フェンスの中に ![media:<id>](caption) をちょうど1行(動画1本固定)。',
  'caption は省略可(![media:<id>]())。<id> は upload_media で作成した media の id(動画ファイルとしてアップロード済みのものを参照すること。画像 id を渡すと壊れる)。',
  'variant=ambient は自動再生・ループ・音声なしの背景動画。variant=player はコントロール付きの通常プレイヤー。省略時は ambient。',
  'poster(サムネイル画像の media id)は variant=player の時のみ指定できる。ambient や省略時に指定すると無視される。省略時は自動生成される。例:',
  '```video variant=player poster=media:5',
  '![media:12](制作の裏側)',
  '```',
].join('\n');

export const videoMcpSupport: McpBlockSupport = {
  blockType: 'video',
  syntaxHelp,
  stripFences,
  validateFences,
  extractMediaIDs,
};
