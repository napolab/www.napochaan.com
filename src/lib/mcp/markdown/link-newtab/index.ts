// MCP write path のリンク newTab 導出。サイト方針「内部リンク=同タブ・外部リンク=別タブ」を
// URL から決定的に導出する（Markdown には newTab を表現する構文がなく、Payload の
// markdown→lexical 変換は newTab: false 固定のため）。設計は
// docs/superpowers/specs/2026-07-19-mcp-link-newtab-design.md を参照。
const HTTP_ABSOLUTE = /^https?:\/\//i;

export const resolveNewTab = (url: string, siteBaseUrl: string): boolean => {
  if (!HTTP_ABSOLUTE.test(url)) return false;
  try {
    return new URL(url).hostname !== new URL(siteBaseUrl).hostname;
  } catch {
    return false;
  }
};
