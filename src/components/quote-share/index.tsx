'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Popover, Toolbar } from 'react-aria-components';

import { Button } from '@components/button';
import { usePointerFine } from '@hooks/use-pointer-fine';
import { useShare } from '@hooks/use-share';

import { buildQuoteBlock } from './build-quote-block';
import { buildQuoteTweetUrl } from './build-quote-tweet-url';
import { CheckIcon, ShareIcon, TwitterIcon } from './icons';
import * as styles from './styles.css';

import type { CSSProperties, ReactNode } from 'react';

type Rect = { top: number; left: number; width: number; height: number };
type Snapshot = { text: string; rect: Rect };

type Props = {
  url: string;
  title: string;
  children: ReactNode;
};

// Gate: only mount the interactive layer on a fine pointer. On touch we return the
// body untouched so the OS selection menu (copy / share) stays the affordance.
export const QuoteShare = ({ url, title, children }: Props) => {
  const fine = usePointerFine();
  if (!fine) return <>{children}</>;

  return (
    <QuoteShareActive url={url} title={title}>
      {children}
    </QuoteShareActive>
  );
};

const QuoteShareActive = ({ url, title, children }: Props) => {
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
    const { anchorNode, focusNode } = selection;
    if (text === '' || anchorNode === null || focusNode === null || !container.contains(anchorNode) || !container.contains(focusNode)) {
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
          <QuoteToolbar url={url} title={title} text={snapshot.text} />
        </Popover>
      )}
    </div>
  );
};

type ToolbarProps = {
  url: string;
  title: string;
  text: string;
};

// Snapshot is guaranteed non-null here (only rendered while a selection is captured),
// so both actions use a settled quote block — pressing a button can't break them even
// though the click collapses the live selection.
const QuoteToolbar = ({ url, title, text }: ToolbarProps) => {
  const block = buildQuoteBlock(text, title, url);
  const shareData = useMemo(() => ({ text: block }) satisfies ShareData, [block]);
  const { copied, share } = useShare(shareData, block);

  return (
    <Toolbar aria-label="選択したテキストを共有" className={styles.toolbar}>
      <Button type="link" variant="outline" size="sm" href={buildQuoteTweetUrl(text, title, url)} target="_blank" rel="noopener noreferrer">
        <TwitterIcon width={16} height={16} />
        Twitter(X) で引用
      </Button>
      <Button variant="outline" size="sm" onPress={share}>
        {copied ? <CheckIcon width={16} height={16} /> : <ShareIcon width={16} height={16} />}
        {copied ? 'コピーしました' : 'シェア'}
      </Button>
    </Toolbar>
  );
};
