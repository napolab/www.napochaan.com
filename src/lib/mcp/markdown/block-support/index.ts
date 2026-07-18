// MCP が Markdown ⇔ Lexical を往復させられる block の契約。block ごとに独立した
// plugin(このファイルの型を満たすオブジェクト)が実装し、markdown/index.ts の
// registry に登録する。plugin 側からこのファイルを import するのは型のみ
// (contract は plugin/registry いずれの実装も知らない — import cycle を作らない)。
export type McpBlockSupport = {
  // この plugin が担当する lexical block の blockType。
  blockType: string;
  // この block の Markdown フェンス構文を LLM に教えるための説明文。tool の
  // bodyMarkdown 説明に集約される(標準 Markdown ではないので明示しないと LLM が
  // 使えると気づけない)。構文・用途・具体例を含める。
  syntaxHelp: string;
  // この block のフェンス形状を検証し、違反ごとに LLM 向け回復指示メッセージを返す。
  validateFences: (markdown: string) => string[];
  // この block のフェンス内が参照する media id を列挙する(存在チェック用)。
  extractMediaIDs: (markdown: string) => number[];
};
