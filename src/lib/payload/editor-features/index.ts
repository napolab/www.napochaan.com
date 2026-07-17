import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';

import { ImageRow } from '../../../blocks/image-row';
import { Video } from '../../../blocks/video';

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
export const blogEditorFeatures: BlogEditorFeatures = ({ defaultFeatures }) => [...defaultFeatures, BlocksFeature({ blocks: [ImageRow, Video] })];
