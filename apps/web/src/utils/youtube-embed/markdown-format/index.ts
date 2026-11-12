// youtube-embed の公開 Markdown 構文(標準リンク形式)の export 側 formatter。
// block field → 単独行の URL / [caption](URL)。web では llms.txt / .md の
// renderYouTubeEmbed(src/utils/lexical/to-markdown)が使う。
//
// cms 側の同名 module(apps/cms/src/blocks/youtube-embed/markdown-format)が MCP の
// jsx.export と往復(unescapeLinkCaption)を担う正本で、この module はその複製。
// 出力が 1:1 で一致することは youtube-embed-sync.test.ts が両方を import して固定する。
//
// caption の [ ] は CommonMark として正しく \[ \] にエスケープして出力する。

const escapeCaption = (caption: string): string => caption.replace(/([[\]])/g, '\\$1');

// block field → 公開 Markdown(単独行)。caption 空なら素の URL、あれば [caption](URL)。
export const formatYouTubeEmbedMarkdown = (url: string, caption: string): string => {
  if (caption === '') return url;

  return `[${escapeCaption(caption)}](${url})`;
};
