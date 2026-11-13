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

type Props = {
  title: string;
  breadcrumbs: readonly Crumb[];
  kicker?: string;
  lead?: string;
  leadReveal?: LeadReveal;
  annotation?: string;
  // 'tight' pulls the title tracking in for long, content titles (e.g. a news
  // detail title) where the default label tracking reads too spread.
  titleTracking?: 'wide' | 'tight';
};

// The blockquote lead: same string, swappable reveal.
const renderLead = (lead?: string, reveal: LeadReveal = 'typewriter'): ReactNode => {
  if (lead === undefined) return null;
  return <p className={styles.lead}>{reveal === 'scramble' ? <ScrambleText>{lead}</ScrambleText> : <TypewriterText>{lead}</TypewriterText>}</p>;
};

export const PageHeader = ({ title, breadcrumbs, kicker, lead, leadReveal, annotation, titleTracking }: Props) => {
  return (
    <header className={styles.root}>
      <Breadcrumbs items={breadcrumbs} />
      {kicker !== undefined ? <p className={styles.kicker}>{kicker}</p> : null}
      {/* Plain h1 (not Heading) so this class owns the type fully — no display
          font / tracking inherited from the Heading defaults to fight. */}
      <h1 className={styles.title} data-tracking={titleTracking}>
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
