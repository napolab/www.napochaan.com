// Lexical's @lexical/code `code` block stores each token as a `code-highlight`
// child, with `linebreak` / `tab` nodes between them. Fold them back into the
// raw source string Shiki needs, and surface the node's `language`.
type CodeChild = { readonly type: string; readonly text?: string };
type CodeNode = { readonly language?: string | null; readonly children?: readonly CodeChild[] };

const childText = (child: CodeChild): string => {
  if (child.type === 'linebreak') return '\n';
  if (child.type === 'tab') return '\t';
  return child.text ?? '';
};

export const extractCode = (node: CodeNode): { code: string; lang?: string } => ({
  code: (node.children ?? []).map(childText).join(''),
  lang: node.language ?? undefined,
});
