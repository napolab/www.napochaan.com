import { convertLexicalToMarkdown, convertMarkdownToLexical } from '@payloadcms/richtext-lexical';

import type { LexicalRichTextAdapter } from '@payloadcms/richtext-lexical';
import type { RichTextAdapter } from 'payload';

// `SanitizedConfig['editor']` is typed as the generic core `RichTextAdapter`
// (payload doesn't know about lexical specifics), but this project's root
// editor is always `lexicalEditor(...)`, which resolves to a
// `LexicalRichTextAdapter` — the same shape carrying `.editorConfig` that
// `editorConfigFactory.fromField` reads off field-level editors.
const isLexicalRichTextAdapter = (adapter: RichTextAdapter | undefined): adapter is LexicalRichTextAdapter => adapter !== undefined && 'editorConfig' in adapter;

// `payload run <script>` strips 'run' and the script path out of `process.argv`
// before importing this file (node_modules/payload/dist/bin/index.js), so
// `src/payload.config.ts`'s `isPayloadCliInvocation` heuristic (which greps
// argv for a leading `run`/`migrate`/... token to decide whether to resolve
// Cloudflare bindings via wrangler's getPlatformProxy) sees a false negative
// and falls through to `getCloudflareContext`, which throws outside `next dev`.
// Restore a matching token before the config is ever imported (dynamic import
// below, so this runs first) to route through the correct branch.
process.argv.push('run');

const MD = ['# heading', '', 'intro paragraph', '', '```image-row', '![media:79](left cap)', '![media:78]()', '```', '', 'outro paragraph'].join('\n');

const main = async (): Promise<void> => {
  const { getPayloadClient } = await import('../src/lib/payload/client');
  const payload = await getPayloadClient();

  // NOTE: `editorConfigFactory.default` resolves Payload's generic 19-feature
  // default editor config (globally cached, see
  // @payloadcms/richtext-lexical/dist/utilities/getDefaultSanitizedEditorConfig.js)
  // — it is NOT derived from `payload.config.editor` at all, so it never
  // includes this project's BlocksFeature([ImageRow]) registration. By the
  // time `getPayload()` finishes, `payload.config.editor` has already been
  // resolved from the `lexicalEditor({...})` provider into a
  // `LexicalRichTextAdapter` with `.editorConfig` on it directly — that IS
  // the project's real root editor config.
  if (!isLexicalRichTextAdapter(payload.config.editor)) throw new Error('payload.config.editor is not a lexical adapter');
  const editorConfig = payload.config.editor.editorConfig;

  const lexical = convertMarkdownToLexical({ editorConfig, markdown: MD });
  const blockNodes = JSON.stringify(lexical).match(/"blockType":"image-row"/g) ?? [];
  console.log('block nodes:', blockNodes.length);
  console.log(
    'lexical (image-row node):',
    JSON.stringify(
      (lexical.root.children as { type: string }[]).find((n) => n.type === 'block'),
      null,
      2,
    ),
  );

  const back = convertLexicalToMarkdown({ editorConfig, data: lexical });
  console.log('--- round-trip markdown ---');
  console.log(back);
  console.log('--- contains fence:', back.includes('```image-row'), '| contains media:79:', back.includes('media:79'));
};

await main();
