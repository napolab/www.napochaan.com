import { SectionHeading } from '@components/section-heading';
import { Table } from '@components/table';

import * as styles from './styles.css';

type WorkRow = {
  id: string;
  no: string;
  title: string;
  type: string;
  year: string;
};

type Props = {
  id?: string;
  works: WorkRow[];
};

const columns = [
  { key: 'no', label: 'no' },
  { key: 'title', label: 'title' },
  { key: 'type', label: 'type' },
  { key: 'year', label: 'year' },
] as const;

export const WorksSection = ({ id, works }: Props) => {
  return (
    <section id={id} className={styles.root}>
      <SectionHeading no="02" more="実績 →" moreHref="/works">
        works
      </SectionHeading>
      <Table columns={columns} rows={works} />
    </section>
  );
};
