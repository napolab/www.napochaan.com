'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Popover, Toolbar } from 'react-aria-components';

import { Button } from '@components/button';
import { useAutoResetState } from '@hooks/use-auto-reset-state';
import { usePointerFine } from '@hooks/use-pointer-fine';
import { buildTweetUrl } from '@utils/tweet-intent';

import { buildTextFragmentUrl } from './build-text-fragment-url';
import { truncateQuote } from './truncate-quote';
import * as styles from './styles.css';

import type { CSSProperties, ReactNode } from 'react';

type Rect = { top: number; left: number; width: number; height: number };
type Snapshot = { text: string; rect: Rect };

type Props = {
  url: string;
  children: ReactNode;
};

// Gate: only mount the interactive layer on a fine pointer. On touch we return the
// body untouched so the OS selection menu (copy / share) stays the affordance.
export const QuoteShare = ({ url, children }: Props) => {
  const fine = usePointerFine();
  if (!fine) return <>{children}</>;

  return <QuoteShareActive url={url}>{children}</QuoteShareActive>;
};

const QuoteShareActive = ({ url, children }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  // pointerup = selection settled. Capture text + rect when the (non-empty)
  // selection is inside our body; otherwise clear. Reading the live selection in a
  // React event handler avoids useEffect / external-store subscription.
  const handlePointerUp = useCallback(() => {
    const selection = window.getSelection();
    const container = containerRef.current;
    if (selection === null || selection.isCollapsed || container === null) {
      setSnapshot(null);
      return;
    }
    const text = selection.toString().trim();
    const anchorNode = selection.anchorNode;
    if (text === '' || anchorNode === null || !container.contains(anchorNode)) {
      setSnapshot(null);
      return;
    }
    const domRect = selection.getRangeAt(0).getBoundingClientRect();
    setSnapshot({ text, rect: { top: domRect.top, left: domRect.left, width: domRect.width, height: domRect.height } });
  }, []);

  // Starting a fresh gesture in the body dismisses the current toolbar. Presses on
  // the toolbar are portaled out of this container, so they never reach here.
  const handlePointerDown = useCallback(() => {
    setSnapshot(null);
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) setSnapshot(null);
  }, []);

  const anchorStyle = useMemo<CSSProperties | undefined>(() => {
    if (snapshot === null) return undefined;
    return {
      '--anchor-top': `${snapshot.rect.top}px`,
      '--anchor-left': `${snapshot.rect.left}px`,
      '--anchor-width': `${snapshot.rect.width}px`,
      '--anchor-height': `${snapshot.rect.height}px`,
    } as CSSProperties;
  }, [snapshot]);

  return (
    <div ref={containerRef} className={styles.root} onPointerUp={handlePointerUp} onPointerDown={handlePointerDown}>
      {children}
      <span ref={triggerRef} className={styles.anchor} style={anchorStyle} aria-hidden="true" />
      {snapshot !== null && (
        <Popover triggerRef={triggerRef} isOpen onOpenChange={handleOpenChange} placement="top" isNonModal className={styles.popover}>
          <QuoteToolbar url={url} text={snapshot.text} />
        </Popover>
      )}
    </div>
  );
};

type ToolbarProps = {
  url: string;
  text: string;
};

// Snapshot is guaranteed non-null here (only rendered while a selection is captured),
// so both action URLs are built from a settled string — pressing a button can't
// break them even though the click collapses the live selection.
const QuoteToolbar = ({ url, text }: ToolbarProps) => {
  const [copied, setCopied] = useAutoResetState(false);
  const fragmentUrl = buildTextFragmentUrl(url, text);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fragmentUrl);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
  }, [fragmentUrl, setCopied]);

  return (
    <Toolbar aria-label="選択したテキストを共有" className={styles.toolbar}>
      <Button variant="outline" onPress={handleCopy}>
        {copied ? 'コピーしました' : '引用リンク'}
      </Button>
      <Button variant="outline" href={buildTweetUrl(truncateQuote(text), fragmentUrl)} target="_blank" rel="noopener noreferrer">
        X で引用 ↗
      </Button>
    </Toolbar>
  );
};
