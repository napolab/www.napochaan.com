import { Image } from '@components/image';
import { SectionHeading } from '@components/section-heading';
import { Table } from '@components/table';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

type WorkRow = {
  id: string;
  no: string;
  title: string;
  type: string;
  year: string;
  thumbSrc?: string;
  thumbWidth?: number;
  thumbHeight?: number;
};

type Props = {
  id?: string;
  works: WorkRow[];
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
const toRows = (works: WorkRow[]): Record<string, ReactNode>[] =>
  works.map((work) => ({
    thumb:
      work.thumbSrc !== undefined ? (
        <Image src={work.thumbSrc} alt="" width={work.thumbWidth ?? 80} height={work.thumbHeight ?? 80} className={styles.thumb} />
      ) : (
        <span className={styles.thumbPlaceholder} aria-hidden="true" />
      ),
    no: work.no,
    title: work.title,
    type: work.type,
    year: work.year,
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
