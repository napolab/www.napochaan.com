import { Image } from '@components/image';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';
import { SectionHeading } from '@components/section-heading';
import { Table } from '@components/table';

import * as styles from './styles.css';

import type { WorkRow } from '../../works/_lib/work-row';
import type { ReactNode } from 'react';

type Props = {
  id?: string;
  works: readonly WorkRow[];
};

const columns = [
  { key: 'thumb', label: '' },
  { key: 'no', label: 'no', desktopOnly: true },
  { key: 'title', label: 'title' },
  { key: 'type', label: 'type' },
  { key: 'year', label: 'year' },
] as const;

// Module-level helper (not an inline array prop) so the contact-sheet rows don't
// trip the no-new-array-as-prop lint in this Server Component.
const toRows = (works: readonly WorkRow[]): Record<string, ReactNode>[] =>
  works.map((work) => ({
    thumb:
      work.thumbnail !== undefined ? (
        <Image src={work.thumbnail.src} alt={work.title} width={work.thumbnail.width} height={work.thumbnail.height} className={styles.thumb} />
      ) : (
        <span className={styles.thumbPlaceholder} aria-hidden="true" />
      ),
    no: work.no,
    title: (
      <Link href={`/works/${work.id}`} tone="accent">
        <ScrambleText>{work.title}</ScrambleText>
      </Link>
    ),
    type: work.type,
    year: `${work.year}`,
  }));

export const WorksSection = ({ id, works }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="02" more="実績 →" moreHref="/works">
        works
      </SectionHeading>
      <Table columns={columns} rows={toRows(works)} />
    </section>
  );
};
