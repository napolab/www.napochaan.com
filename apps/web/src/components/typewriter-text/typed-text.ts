// Writes the typed copy in front of the caret span — the DOM half of the typewriter
// for the framework-free elements (<typewriter-text>, <boot-question>). The caret
// (and anything the host keeps after it) is never touched; only the nodes before it
// are replaced, so the blinking caret animation never restarts.
export const writeBeforeCaret = (caret: Element, nodes: readonly Node[]): void => {
  const parent = caret.parentNode;
  if (parent === null) return;
  while (caret.previousSibling !== null) caret.previousSibling.remove();
  for (const node of nodes) parent.insertBefore(node, caret);
};

// One text node (none for an empty string, as React renders `{''}`).
export const textNodes = (text: string): Node[] => (text === '' ? [] : [document.createTextNode(text)]);
