// `video` フェンス構文(```video フェンスと本文1行)の唯一の定義元。
// image-row/fence と同じ役割: Payload の block jsx multiline-element transformer
// (customStartRegex/customEndRegex)に渡す正規表現と、フェンス本文1行の media 参照
// パーサ、複数行スキャン用の VIDEO_FENCE をここに集約する。将来の MCP 側 markdown
// 検証(src/lib/mcp/markdown 相当)はこの定義を読む — ここが唯一の定義元。

// 行単位フォーム。Payload の block jsx transformer は候補行を1行ずつ渡してくるため、
// 1行にアンカーする `^...$` で `m`/`g` フラグは持たない。
// 開始行の形: ```video[ variant=ambient|player][ poster=media:<id>]
// group1 は Payload 側の JSX props 抽出(extractPropsFromJSXPropsString)にそのまま
// propsString として渡り、`variant=ambient poster=media:5` のような unquoted
// key=value 列としてパースされる(openMatch[1] -> props.variant / props.poster)。
export const FENCE_START = /^```video(?:\s+(.+?))?\s*$/;
export const FENCE_END = /^```\s*$/;

// フェンス内の唯一の本文行: `![media:<id>](<caption>)`。caption は省略可。
export const MEDIA_LINE = /^\s*!\[media:(\d+)\]\((.*)\)\s*$/;

// 開始行の `poster=media:<id>` 属性値(extractPropsFromJSXPropsString 後の文字列)
// から id を取り出す。
export const POSTER_REF = /^media:(\d+)$/;

// 複数行・全文書スキャン用フォーム(image-row の IMAGE_ROW_FENCE と同型)。MCP 側は
// Markdown 文書全体を文字列として受け取るため、フェンス全体(開始〜終了)を1つの
// 正規表現でキャプチャする必要があり、`gm` フラグを持つ。開始行は
// `(?:[ \t][^\n]*)?\n` で、props 列の前に空白/タブが必須(または省略して即改行)と
// することで fourcc 境界を強制する — 単なる `[^\n]*` だと ```videofoo のような
// 不正な開始行まで video フェンスとして拾ってしまい、FENCE_START(props を
// `\s+` で区切る)の判定と食い違う。省略可能グループを `\s+.*?` のような曖昧な形に
// すると、props 省略時にバックトラックで本文行まで飲み込み group1 が空になる点は
// 従来通り注意。閉じ行の末尾も `[ \t]*$` で同一行内に限定し(`\s*$` は次行の改行まで
// 貪欲に飲み込む)、match[1] は常に「本文行(0行以上、末尾改行込み)」を正確に指す。
export const VIDEO_FENCE = /^```video(?:[ \t][^\n]*)?\n([\s\S]*?)^```[ \t]*$/gm;

// フェンス内テキストを trim 済み・空行除去済みの行配列にする。block 定義の
// jsx.import(children は改行結合済み)と将来の MCP 側フェンス検証の両方が使う。
export const fenceBodyLines = (inner: string): string[] =>
  inner
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
