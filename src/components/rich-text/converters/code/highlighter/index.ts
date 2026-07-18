import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

import type { HighlighterCore } from 'shiki/core';
import type { ThemeRegistrationRaw } from '@shikijs/types';

export const CODE_THEME_NAME = 'napochaan-code';

// Token foregrounds are CSS variables, defined from Panda tokens in the code
// block's styles.css.ts. `background` is transparent so the Panda light panel
// container (bg.muted = gray-3) provides the surface; Shiki only paints token colors.
const CODE_THEME: ThemeRegistrationRaw = {
  name: CODE_THEME_NAME,
  type: 'light',
  settings: [
    { settings: { foreground: 'var(--code-fg)', background: 'transparent' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--code-comment)' } },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator'],
      settings: { foreground: 'var(--code-keyword)' },
    },
    {
      scope: ['string', 'string.quoted', 'punctuation.definition.string', 'constant.other.symbol'],
      settings: { foreground: 'var(--code-string)' },
    },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: 'var(--code-number)' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call', 'entity.name.tag'], settings: { foreground: 'var(--code-function)' } },
    { scope: ['punctuation', 'meta.brace', 'meta.delimiter'], settings: { foreground: 'var(--code-punctuation)' } },
  ],
};

// Preloaded language keys. Must stay 1:1 with BOTH the literal `import()` list in
// `getHighlighter` below (dynamic import paths must stay literal for bundling) AND
// the editor's language select (src/blocks/code CODE_LANGUAGES — asserted by its test).
export const PRELOADED_LANGUAGE_KEYS = ['typescript', 'tsx', 'css', 'json', 'bash'] as const;

// Module-level singleton: a Worker isolate initializes the highlighter once and
// reuses it across requests. createHighlighterCore is async + costly.
const cache: { promise?: Promise<HighlighterCore> } = {};

export const getHighlighter = (): Promise<HighlighterCore> => {
  cache.promise ??= createHighlighterCore({
    themes: [CODE_THEME],
    langs: [import('@shikijs/langs/typescript'), import('@shikijs/langs/tsx'), import('@shikijs/langs/css'), import('@shikijs/langs/json'), import('@shikijs/langs/bash')],
    engine: createJavaScriptRegexEngine(),
  });

  return cache.promise;
};
