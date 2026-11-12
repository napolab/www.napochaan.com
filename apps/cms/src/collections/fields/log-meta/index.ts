import type { Log } from '@payload-types';

// 年表に表示する種別ラベルの正準値。値がそのまま画面に出るため、既存行
// (DJ / VJ / DJ/VJ)とバイト一致していなければならない。
//
// collection 本体(src/collections/logs.ts)ではなくここに置くのは、logs.ts が
// ./hooks/revalidate 経由で next/cache を引いており、MCP ツール(src/lib/mcp/tools/logs)や
// node 環境の vitest から import できないため。ここは依存ゼロの葉に保つこと。
//
// `satisfies readonly Log['meta'][]` により、payload-types.ts の再生成で union が
// 変わった瞬間にコンパイルエラーになる。
export const LOG_META_OPTIONS = ['DJ', 'VJ', 'DJ/VJ', 'Support', 'Dev', 'Flyer', 'Talk', 'Video'] as const satisfies readonly Log['meta'][];
