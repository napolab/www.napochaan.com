// youtube-embed の公開 Markdown 構文(標準リンク形式)の export 側 formatter。
// block field → 単独行の URL / [caption](URL)。
// jsx.export(src/blocks/youtube-embed/index.ts)と llms.txt の
// renderYouTubeEmbed(src/utils/lexical/to-markdown)の両方がこれを使う。
//
// import 方向(リンク行 → block)は Markdown 文字列の前処理ではなく、
// convertMarkdownToLexical 後の汎用 lexical tree 変換(@utils/lexical/link-embed +
// ../embed-provider)が担う。
//
// caption の [ ] は CommonMark として正しく \[ \] にエスケープして出力する
// (llms.txt など外部の Markdown 消費者向け)。ただし lexical の Markdown importer
// (link transformer の importRegExp)はバックスラッシュを解釈せず文字通り残すため、
// MCP 往復での復元(アンエスケープ)は汎用層の unescapeLinkCaption
// (@utils/lexical/link-embed)が行う — このエスケープと 1:1 の逆変換で、往復は
// markdown-format.test.ts と ../embed-provider/embed-provider.test.ts が固定する
// (実測: \] はリンクテキストに素通しされ、\[ は import regex の [^[]+ が
// [ を許さないためリンクとして解釈されない)。

const escapeCaption = (caption: string): string => caption.replace(/([[\]])/g, '\\$1');

// block field → 公開 Markdown(単独行)。caption 空なら素の URL、あれば [caption](URL)。
export const formatYouTubeEmbedMarkdown = (url: string, caption: string): string => {
  if (caption === '') return url;

  return `[${escapeCaption(caption)}](${url})`;
};
