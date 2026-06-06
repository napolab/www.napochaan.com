'use client';

import { useEffect, useRef } from 'react';

import { fromNormalized, type Rect } from '@lib/cursor/coordinate';
import { type CursorColor } from '@lib/cursor/identity';

import * as styles from './styles.css';

const MAX_RENDERED = 30;
const colorVar = (color: CursorColor): string => `var(--colors-cursor-${color})`;

export type RemoteCursor = { id: string; color: CursorColor; label: string };

type Props = {
  getRect: () => Rect | null;
  registerMove: (apply: (id: string, nx: number, ny: number) => void) => void;
  registerPresence: (apply: (cursors: RemoteCursor[]) => void) => void;
};

export const CursorLayer = ({ getRect, registerMove, registerPresence }: Props) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    registerMove((id, nx, ny) => {
      const node = nodes.current.get(id);
      const rect = getRect();
      if (node === undefined || rect === null) return;
      const p = fromNormalized(rect, { nx, ny });
      node.style.translate = `${p.x}px ${p.y}px`;
    });

    registerPresence((cursors) => {
      const layer = layerRef.current;
      if (layer === null) return;
      const visible = cursors.slice(0, MAX_RENDERED);
      const keep = new Set(visible.map((c) => c.id));

      for (const [id, node] of nodes.current) {
        if (keep.has(id)) continue;
        node.remove();
        nodes.current.delete(id);
      }
      for (const c of visible) {
        if (nodes.current.has(c.id)) continue;
        const node = document.createElement('div');
        node.className = styles.cursor;
        node.innerHTML = `<span class="${styles.glyph}" style="color:${colorVar(c.color)}">✕</span><span class="${styles.label}" style="background:${colorVar(c.color)}">${c.label}</span>`;
        layer.appendChild(node);
        nodes.current.set(c.id, node);
      }

      const moreNode = layer.querySelector<HTMLDivElement>('[data-more]');
      const overflow = cursors.length - visible.length;
      if (overflow > 0) {
        const el = moreNode ?? document.createElement('div');
        el.className = styles.more;
        el.dataset.more = 'true';
        el.textContent = `+${overflow} more`;
        if (moreNode === null) layer.appendChild(el);

        return;
      }
      if (moreNode !== null) moreNode.remove();
    });
  }, [getRect, registerMove, registerPresence]);

  return <div ref={layerRef} className={styles.layer} aria-hidden="true" />;
};
