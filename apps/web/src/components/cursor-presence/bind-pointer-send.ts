import { toNormalized, type Rect } from '@lib/cursor/coordinate';

import type { VisitorPointerApp } from '@lib/cursor/visitor-pointer-app';

type PointerSendBinding = {
  app: VisitorPointerApp;
  getRect: () => Rect | null;
  isEnabled: () => boolean;
};

// Broadcasts this visitor's pointer, normalized to the cursor surface, while presence
// is enabled. Fine pointers only (a touch "pointer" has no hover position to share).
// Shared by the React CursorPresence and the <cursor-presence> element.
export const bindPointerSend = ({ app, getRect, isEnabled }: PointerSendBinding): (() => void) => {
  if (!matchMedia('(pointer:fine)').matches) return () => {};
  const onMove = (e: PointerEvent): void => {
    const rect = getRect();
    if (rect === null || !isEnabled()) return;
    const n = toNormalized(rect, e.pageX, e.pageY);
    app.send({ x: n.nx, y: n.ny });
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  return () => {
    window.removeEventListener('pointermove', onMove);
  };
};
