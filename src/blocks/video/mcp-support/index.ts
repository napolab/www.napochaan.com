import { VIDEO_FENCE } from '../fence';
import { runFenceChecks } from './checks';
import { attrValue, bodyMediaIDOf, posterIDOf, propsOf } from './shared';

import type { McpBlockSupport } from '@lib/mcp/markdown/block-support';

// video フェンスを丸ごと除去した Markdown を返す。image-row と同じ理由: フェンス内の
// ![media:<id>](caption) は video フェンス内でのみ有効な構文なので、フェンスを除去した
// 残りを生URL画像参照スキャンにかければフェンス外の誤用だけが対象になる。
const stripFences = (markdown: string): string => markdown.replace(VIDEO_FENCE, '');

// 各 video フェンスに checks/* の plugin registry を適用し、違反ごとの LLM 向け回復
// 指示を返す。registry は collect-all runner(image-ref の runPlugins は first-match
// dispatch だが、こちらは全 plugin を実行して違反を全部集める) — 詳細は checks/index.ts。
const validateFences = (markdown: string): string[] =>
  [...markdown.matchAll(VIDEO_FENCE)].flatMap((match) => {
    const fenceText = match[0];
    const body = match[1] ?? '';
    const props = propsOf(fenceText);
    const variant = attrValue(props, 'variant');

    return runFenceChecks({ fenceText, body, props, variant });
  });

// 全 video フェンスが参照する media id を列挙(存在チェック用)。body の動画1本に加え、
// 開始行に poster=media:<id> があればそれも含める(MCP 側で poster の存在も検証するため)。
const extractMediaIDs = (markdown: string): number[] =>
  [...markdown.matchAll(VIDEO_FENCE)].flatMap((match) => {
    const fenceText = match[0];
    const body = match[1] ?? '';
    const props = propsOf(fenceText);
    const videoID = bodyMediaIDOf(body);
    const posterID = posterIDOf(props);

    return [videoID, posterID].filter((id): id is number => id !== undefined);
  });

// LLM 向けの構文説明。tool の bodyMarkdown 説明に集約される。
const syntaxHelp = [
  '動画を1本埋め込む video block(標準 Markdown ではない):',
  '```video variant=<ambient|player>[ poster=media:<id>] フェンスの中に ![media:<id>](caption) をちょうど1行(動画1本固定)。',
  'caption は省略可(![media:<id>]())。<id> は upload_media で作成した media の id(動画ファイルとしてアップロード済みのものを参照すること。画像 id を渡すと壊れる)。',
  'variant=ambient は自動再生・ループ・音声なしの背景動画。variant=player はコントロール付きの通常プレイヤー。省略時は ambient。',
  'poster(サムネイル画像の media id)は variant=player の時のみ指定できる。ambient や省略時に指定すると無視される。省略時は自動生成される。例:',
  '```video variant=player poster=media:5',
  '![media:12](制作の裏側)',
  '```',
].join('\n');

export const videoMcpSupport: McpBlockSupport = {
  blockType: 'video',
  syntaxHelp,
  stripFences,
  validateFences,
  extractMediaIDs,
};
