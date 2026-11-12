import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// web is display-only: every CMS read goes through `@napochaan/cms-api` Hono RPC over
// `env.CMS`, and Payload itself lives in apps/cms. Only the two render-side packages may
// be value-imported here; type-only imports (`import type`) are erased and always fine.
const ALLOWED_SPECIFIERS = ['@payloadcms/richtext-lexical/react', '@payloadcms/live-preview-react'] as const;

const APP_ROOT = path.resolve(import.meta.dirname, '..');
const SCANNED_DIRS = ['src', 'worker'] as const;
const SOURCE_FILE = /\.tsx?$/;
const SKIPPED_DIRS = new Set(['node_modules', '.next', '.open-next']);

// `import x from 's'`, `import 's'`, `export … from 's'` (multi-line clauses included)
// and dynamic `import('s')`. `import type` / `export type` are dropped before matching.
const STATIC_IMPORT = /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

const isPayloadSpecifier = (specifier: string): boolean => specifier === 'payload' || specifier.startsWith('payload/') || specifier.startsWith('@payloadcms/');

const isAllowedSpecifier = (specifier: string): boolean => ALLOWED_SPECIFIERS.some((allowed) => specifier === allowed);

const listSourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIPPED_DIRS.has(entry.name)) return [];
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);

    return SOURCE_FILE.test(entry.name) ? [fullPath] : [];
  });

const extractValueSpecifiers = (source: string): string[] => {
  const staticSpecifiers = [...source.matchAll(STATIC_IMPORT)].filter((match) => match[2] === undefined).map((match) => match[3] ?? '');
  const dynamicSpecifiers = [...source.matchAll(DYNAMIC_IMPORT)].map((match) => match[1] ?? '');

  return [...staticSpecifiers, ...dynamicSpecifiers];
};

const findViolations = (file: string): string[] =>
  extractValueSpecifiers(readFileSync(file, 'utf8'))
    .filter((specifier) => isPayloadSpecifier(specifier) && !isAllowedSpecifier(specifier))
    .map((specifier) => `${path.relative(APP_ROOT, file)} → ${specifier}`);

describe('extractValueSpecifiers', () => {
  it('collects value, side-effect, re-export and dynamic imports', () => {
    const source = ["import { a } from 'payload';", "import 'payload/shared';", "export { b } from '@payloadcms/next';", "const c = await import('@payloadcms/plugin-seo');"].join('\n');

    expect(extractValueSpecifiers(source)).toEqual(['payload', 'payload/shared', '@payloadcms/next', '@payloadcms/plugin-seo']);
  });

  it('follows multi-line import clauses', () => {
    expect(extractValueSpecifiers("import {\n  a,\n  b,\n} from 'payload';")).toEqual(['payload']);
  });

  it('ignores type-only imports and re-exports', () => {
    const source = ["import type { A } from 'payload';", "export type { B } from '@payloadcms/next';"].join('\n');

    expect(extractValueSpecifiers(source)).toEqual([]);
  });
});

describe('apps/web is Payload-free', () => {
  it('value-imports no Payload package except the render-side allow-list', () => {
    // This file's own fixtures (string literals above) would match, so it is skipped.
    const files = SCANNED_DIRS.flatMap((dir) => listSourceFiles(path.join(APP_ROOT, dir))).filter((file) => file !== import.meta.filename);

    expect(files.flatMap(findViolations)).toEqual([]);
  });
});
