import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';

import { Code } from '../../../blocks/code';
import { ImageRow } from '../../../blocks/image-row';
import { YouTubeEmbed } from '../../../blocks/youtube-embed';

// FeaturesInput は package root から export されていないので lexicalEditor の
// パラメータ型から導出する。
type BlogEditorFeatures = NonNullable<NonNullable<Parameters<typeof lexicalEditor>[0]>['features']>;

// プロジェクト共通の lexical editor features。payload.config の editor 定義と、
// MCP route が convertLexicalToMarkdown 用に組む editorConfig の両方で使う。
//
// 重要: MCP route 側は `editorConfigFactory.fromFeatures({ features: blogEditorFeatures })`
// でこの features から editorConfig を組むこと(`payload.config.editor.editorConfig`
// を直接使わない)。後者は payload.config 側の lexical コピーで作られ、route バンドルの
// convertLexicalToMarkdown が使う lexical コピーと ServerBlockNode のクラスが一致せず
// 「multiple copies of lexical」エラーで block の変換が落ちる。同じ richtext-lexical の
// factory で組めば同一 lexical インスタンスになり整合する。
// blocks の登録順は Markdown import の優先順でもある($importMultiline は transformer を
// 登録順に試して最初の一致を採用する)。Code(premade)の customStartRegex ```(\w+)? は
// ```image-row 行の先頭にも部分一致するため、ImageRow は必ず Code より先に置くこと。
// YouTubeEmbed は Markdown import に参加しない(customStartRegex はどの行にも
// マッチしない dead スタブ — 取り込みは汎用 link-embed transform
// (src/utils/lexical/link-embed)+ src/blocks/youtube-embed/embed-provider が担う)
// ため順序に制約はないが、editor/admin と export のために登録は必要。
export const blogEditorFeatures: BlogEditorFeatures = ({ defaultFeatures }) => [...defaultFeatures, BlocksFeature({ blocks: [ImageRow, YouTubeEmbed, Code] })];
