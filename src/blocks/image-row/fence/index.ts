// `image-row` フェンス構文(```image-row フェンスとセル行)の唯一の定義元。
// 同じ構文を 2 つの異なる消費コンテキストが読むため、2 つの正規表現の形で
// 公開する(どちらも import しているのは src/blocks/image-row/index.ts の
// block 定義 jsx と src/blocks/image-row/mcp-support のみ)。

// 行単位フォーム。Payload の block jsx transformer(customStartRegex/customEndRegex)
// は候補行を 1 行ずつ渡してくるため、1 行にアンカーする `^...$` で `m`/`g` フラグは
// 持たない。src/blocks/image-row/index.ts の jsx.customStartRegex/customEndRegex が
// そのまま使う。
export const FENCE_START = /^```image-row\s*$/;
export const FENCE_END = /^```\s*$/;

// 複数行・全文書スキャン用フォーム。MCP 側(src/lib/mcp/markdown)は 1 行ずつではなく
// Markdown 文書全体を文字列として受け取るため、フェンス全体(開始〜終了)を 1 つの
// 正規表現でキャプチャする必要があり、`gm` フラグを持つ。FENCE_START/FENCE_END と
// 同じ構文を表しているが、構文としては 1 箇所(このファイル)にしか定義しない。
export const IMAGE_ROW_FENCE = /^```image-row\s*\n([\s\S]*?)^```\s*$/gm;

// フェンス内のセル行 1 行: `![media:<id>](<caption>)`。caption は省略可。
export const CELL_LINE = /^\s*!\[media:(\d+)\]\((.*)\)\s*$/;

// フェンス内テキストを trim 済み・空行除去済みの行配列にする。block 定義の
// jsx.import(children は改行結合済み)と MCP 側のフェンス検証(IMAGE_ROW_FENCE が
// キャプチャしたフェンス本文)の両方が使う。
export const fenceCellLines = (inner: string): string[] =>
  inner
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
