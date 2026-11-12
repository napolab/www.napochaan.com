import type { Work } from '@payload-types';

// works の種別(`type` select)の正準値。admin の options と MCP の z.enum を同じ配列から
// 組むため、ここを唯一の定義場所にする。
//
// collection 本体(src/collections/works.ts)ではなくここに置くのは、works.ts が
// ./hooks/revalidate 経由で next/cache を引いており、MCP ツール(src/lib/mcp/tools/works)や
// node 環境の vitest から import できないため。ここは依存ゼロの葉に保つこと。
//
// `satisfies readonly Work['type'][]` により、payload-types.ts の再生成で union が
// 変わった瞬間にコンパイルエラーになる。
export const WORK_TYPE_OPTIONS = ['production', 'talk', 'support'] as const satisfies readonly Work['type'][];

// admin に表示する日本語ラベル。`satisfies Record<Work['type'], string>` で
// union の全値にラベルがあることを保証する。
export const WORK_TYPE_LABELS = { production: '制作', talk: '登壇', support: '制作協力' } satisfies Record<Work['type'], string>;
