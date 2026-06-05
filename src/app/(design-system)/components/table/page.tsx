import { css } from '@styled/css';

import { Table } from '@components/table';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });

const columns = [
  { key: 'no', label: 'no' },
  { key: 'title', label: 'title' },
  { key: 'date', label: 'date' },
  { key: 'venue', label: 'venue' },
];

const rows = [
  { no: '01', title: 'night vol.13', date: '2024.03.15', venue: 'club metro' },
  { no: '02', title: 'techno set', date: '2024.04.20', venue: 'circus osaka' },
  { no: '03', title: 'ambient session', date: '2024.05.01', venue: 'forestlimit' },
];

const TableShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Table</h1>
      <section aria-label="Event history table">
        <Table columns={columns} rows={rows} caption="event history 2024" />
      </section>
      <section aria-label="Simple table without caption">
        <Table columns={columns.slice(0, 2)} rows={rows.slice(0, 2)} />
      </section>
    </main>
  );
};

export default TableShowcase;
