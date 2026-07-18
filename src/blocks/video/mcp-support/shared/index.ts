import { FENCE_START, MEDIA_LINE, POSTER_REF, fenceBodyLines } from '../../fence';

// 開始行(match[0] の1行目)の unquoted props 文字列を取り出す。VIDEO_FENCE の group1
// は本文行そのものなので、props は match[0] から改めて1行目だけを切り出して
// FENCE_START に通す。checks/* plugin と extractMediaIDs の両方が使う共有ヘルパー
// (旧: mcp-support/index.ts にローカル定義)。
export const propsOf = (fenceText: string): string => (fenceText.split('\n', 1)[0] ?? '').match(FENCE_START)?.[1] ?? '';

// 開始行の unquoted `key=value` 属性列(空白区切り)から指定 key の値を取り出す。
// Payload 側の extractPropsFromJSXPropsString と同じ「空白区切りの key=value」を
// MCP 側の検証用に素朴にパースするだけで、fence の構文そのものを表す正規表現
// (FENCE_START/MEDIA_LINE/POSTER_REF)は一切再定義しない。
export const attrValue = (props: string, key: string): string | undefined =>
  props
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token): [string, string | undefined] => {
      const [tokenKey, ...rest] = token.split('=');
      return [tokenKey ?? '', rest.length > 0 ? rest.join('=') : undefined];
    })
    .find(([tokenKey]) => tokenKey === key)?.[1];

// body(フェンス内テキスト)がちょうど1行の有効な media 行であれば、その id を返す。
export const bodyMediaIDOf = (body: string): number | undefined => {
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
// 存在すれば常に対象 — 存在チェックは checks/* の意味検証とは別の関心事)。
export const posterIDOf = (props: string): number | undefined => {
  const raw = attrValue(props, 'poster');
  if (raw === undefined) return undefined;

  const match = raw.match(POSTER_REF);
  if (match === null) return undefined;

  const id = parseInt(match[1] ?? '', 10);
  return Number.isNaN(id) ? undefined : id;
};
