import { cx } from '@styled/css';

import { Breadcrumbs } from '@components/breadcrumbs';
import { ScrambleText } from '@components/scramble-text';
import { SystemAnnotation } from '@components/system-annotation';
import { TypewriterText } from '@components/typewriter-text';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

type Crumb = {
  href?: string;
  label: string;
};

// How the lead text reveals. 'typewriter' (default) types it out one keystroke
// at a time; 'scramble' decodes it through glitch glyphs on hover (e.g. the
// colophon's tagline). The text itself always stays a plain `lead` string.
type LeadReveal = 'typewriter' | 'scramble';

// The full internal prop surface, including the 'tight' tracking variant and the
// `titleClassName` it requires. `PageHeader` (./index.tsx) and `TightPageHeader`
// (./tight.tsx) each expose their own narrower public surface over this — see
// tight.tsx's header comment for why 'tight' is gated behind a dedicated entry
// component instead of being reachable from here directly.
export type PageHeaderBaseProps = {
  title: string;
  breadcrumbs: readonly Crumb[];
  kicker?: string;
  lead?: string;
  leadReveal?: LeadReveal;
  annotation?: string;
  // 'tight' pulls the title tracking in for long, content titles (e.g. a news
  // detail title) where the default label tracking reads too spread.
  titleTracking?: 'wide' | 'tight';
  // Extra class merged onto the h1, alongside `styles.title`. `TightPageHeader`
  // uses this to attach the next/font `.variable` class that defines the
  // `--font-zen-kaku-gothic-new` custom property the `titleJP` token reads —
  // custom properties resolve from the element they're set on, so applying the
  // class directly to the h1 is sufficient (no ancestor wiring needed).
  titleClassName?: string;
};

// The blockquote lead: same string, swappable reveal.
const renderLead = (lead?: string, reveal: LeadReveal = 'typewriter'): ReactNode => {
  if (lead === undefined) return null;
  return <p className={styles.lead}>{reveal === 'scramble' ? <ScrambleText>{lead}</ScrambleText> : <TypewriterText>{lead}</TypewriterText>}</p>;
};

export const PageHeaderBase = ({ title, breadcrumbs, kicker, lead, leadReveal, annotation, titleTracking, titleClassName }: PageHeaderBaseProps) => {
  return (
    <header className={styles.root}>
      <Breadcrumbs items={breadcrumbs} />
      {kicker !== undefined ? <p className={styles.kicker}>{kicker}</p> : null}
      {/* Plain h1 (not Heading) so this class owns the type fully — no display
          font / tracking inherited from the Heading defaults to fight. */}
      <h1 className={cx(styles.title, titleClassName)} data-tracking={titleTracking}>
        {title}
      </h1>
      {renderLead(lead, leadReveal)}
      {annotation !== undefined ? (
        <SystemAnnotation tone="muted" className={styles.annotation}>
          {annotation}
          <span className={styles.squareBlue} aria-hidden="true" />
          <span className={styles.squareRed} aria-hidden="true" />
        </SystemAnnotation>
      ) : null}
    </header>
  );
};
