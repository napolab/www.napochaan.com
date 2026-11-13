import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// The site shell's custom elements exist so a typical page loads no React. One static
// import that reaches React (e.g. a store that still lives next to a hook) would put
// react / react-dom back into every page's initial graph, so walk each element module's
// STATIC import graph and assert it never reaches a React package. Dynamic `import()`s
// are not followed: the SysBar's lazily mounted menu is the one place React may load.
const SRC = path.resolve(import.meta.dirname, '..');
const ROOT = path.resolve(SRC, '..');
const ALIASES: Record<string, string> = {
  '@components/': path.join(SRC, 'components/'),
  '@utils/': path.join(SRC, 'utils/'),
  '@lib/': path.join(SRC, 'lib/'),
  '@hooks/': path.join(SRC, 'hooks/'),
  '@themes/': path.join(SRC, 'themes/'),
  '@styled/': path.join(ROOT, 'styled-system/'),
};
const REACT = /^(react|react-dom|react-aria|react-aria-components|@react-aria|@react-stately)(\/|$)/;

const resolveFile = (base: string): string | undefined => {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, `${base}.js`, path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.mjs')];
  return candidates.find((file) => existsSync(file) && statSync(file).isFile());
};

const resolveSpecifier = (specifier: string, from: string): string | undefined => {
  if (specifier.startsWith('.')) return resolveFile(path.resolve(path.dirname(from), specifier));
  const alias = Object.keys(ALIASES).find((prefix) => specifier.startsWith(prefix));
  if (alias === undefined) return undefined; // a package
  return resolveFile(path.join(ALIASES[alias] ?? '', specifier.slice(alias.length)));
};

// `import x from '…'` / `import '…'` / `export … from '…'`, minus type-only imports.
const STATIC_IMPORT = /^\s*(import|export)\s+(?!type\s)(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/gm;

const reactImportsOf = (entry: string): string[] => {
  const seen = new Set<string>();
  const found: string[] = [];
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const [, , specifier = ''] of readFileSync(file, 'utf8').matchAll(STATIC_IMPORT)) {
      if (REACT.test(specifier)) found.push(`${path.relative(SRC, file)} → ${specifier}`);
      const next = resolveSpecifier(specifier, file);
      if (next !== undefined) visit(next);
    }
  };
  visit(entry);
  return found;
};

const elementModules = [
  ...readdirSync(path.join(SRC, 'components'))
    .map((dir) => path.join(SRC, 'components', dir, 'element.ts'))
    .filter((file) => existsSync(file)),
  path.join(SRC, 'features/colophon/demos/cursor-presence-demo-element.ts'),
].map((file) => ({ module: path.relative(SRC, file), file }));

describe('custom element import graphs', () => {
  it('cover the shell elements that replaced React islands', () => {
    expect(elementModules.map(({ module }) => module)).toEqual(
      expect.arrayContaining(['components/game-of-life/element.ts', 'components/cursor-presence/element.ts', 'components/sys-bar/element.ts']),
    );
  });

  it.each(elementModules)('$module never statically imports React', ({ file }) => {
    expect(reactImportsOf(file)).toEqual([]);
  });

  // Sanity check of the walker itself: the lazily mounted menu does reach React.
  it('detects React in the SysBar menu mount module', () => {
    expect(reactImportsOf(path.join(SRC, 'components/sys-bar/nav-menu/mount.tsx')).length).toBeGreaterThan(0);
  });
});
