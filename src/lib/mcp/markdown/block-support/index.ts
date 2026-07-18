import type { LinkEmbedProvider } from '@utils/lexical/link-embed';

// MCP が Markdown ⇔ Lexical を往復させられる block の契約。block ごとに独立した
// plugin(このファイルの型を満たすオブジェクト)が実装し、markdown/index.ts の
// registry に登録する。plugin 側からこのファイルを import するのは型のみ
// (contract は plugin/registry いずれの実装も知らない — import cycle を作らない。
// LinkEmbedProvider は汎用層 @utils/lexical/link-embed への type-only 参照で、
// 特定 block の実装依存ではない)。
export type McpBlockSupport = {
  // この plugin が担当する lexical block の blockType。
  blockType: string;
  // この block の Markdown フェンス構文を LLM に教えるための説明文。tool の
  // bodyMarkdown 説明に集約される(標準 Markdown ではないので明示しないと LLM が
  // 使えると気づけない)。構文・用途・具体例を含める。
  syntaxHelp: string;
  // この block の担当構文を検証し、違反ごとに LLM 向け回復指示メッセージを返す(任意)。
  // 常に呼び出し元の raw Markdown 入力に対して走る(検証しない block は省略)。
  validateFences?: (markdown: string) => string[];
  // 標準 Markdown のまま lexical に入った単独リンク行(例: youtube-embed の動画 URL 行
  // → paragraph node)をこの block の node へ置き換えるための provider(任意)。
  // block ごとの tree 変換関数(旧 transformLexicalBody)ではなく provider を公開する
  // 理由: 全 block の provider を registry 側が 1 本の汎用 transform
  // (@utils/lexical/link-embed)に合成することで、tree walk が N plugin 回でなく
  // 1 回で済み、段落ごとの first-match が登録順で決まる(prefix-match-processor)。
  linkEmbedProvider?: LinkEmbedProvider;
  // この block のフェンス内が参照する media id を列挙する(存在チェック用)。
  extractMediaIDs: (markdown: string) => number[];
};
