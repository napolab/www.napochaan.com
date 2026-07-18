import { CELL_LINE, IMAGE_ROW_FENCE, fenceCellLines } from '../fence';

import type { McpBlockSupport } from '@lib/mcp/markdown/block-support';

// 各 image-row フェンスが「ちょうど2行の ![media:<id>](...)」であることを検証。
// 違反ごとに LLM 向け回復指示を返す。
const validateFences = (markdown: string): string[] =>
  [...markdown.matchAll(IMAGE_ROW_FENCE)]
    .filter((match) => {
      const lines = fenceCellLines(match[1] ?? '');
      const cells = lines.filter((line) => CELL_LINE.test(line));
      return lines.length !== 2 || cells.length !== 2;
    })
    .map((match) => `image-row フェンスは ![media:<id>](caption) をちょうど2行含む必要があります(画像2枚固定)。caption は省略可(![media:<id>]())。該当:\n${match[0]}`);

// 全 image-row フェンスの cell media id を列挙(存在チェック用)。
const extractMediaIDs = (markdown: string): number[] =>
  [...markdown.matchAll(IMAGE_ROW_FENCE)].flatMap((match) =>
    fenceCellLines(match[1] ?? '')
      .map((line) => line.match(CELL_LINE))
      .filter((cell): cell is RegExpMatchArray => cell !== null)
      .map((cell) => parseInt(cell[1] ?? '', 10)),
  );

// MCP の markdown registry(src/lib/mcp/markdown)に登録する image-row の plugin。
// fence 構文自体は ../fence が唯一の定義元 — ここはその構文を使った
// validate/extract のロジックだけを持つ。
// LLM 向けの構文説明。tool の bodyMarkdown 説明に集約される。
const syntaxHelp = [
  '画像2枚を横並びにする image-row block(標準 Markdown ではない):',
  '```image-row フェンスの中に ![media:<id>](caption) をちょうど2行(画像2枚固定)。',
  'caption は省略可(![media:<id>]())。<id> は upload_media で作成した media の id。例:',
  '```image-row',
  '![media:12](左の説明)',
  '![media:13]()',
  '```',
].join('\n');

export const imageRowMcpSupport = {
  blockType: 'image-row',
  syntaxHelp,
  validateFences,
  extractMediaIDs,
} satisfies McpBlockSupport;
