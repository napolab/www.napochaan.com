import { css } from '@styled/css';

import { DescriptionList, List } from '@components/list';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const subHeading = css({ fontFamily: 'mono', fontSize: 'sm', color: 'fg.muted', mb: '2' });

const unorderedItems = ['vinyl selection', 'live PA set', 'ambient drone'];
const orderedItems = ['01. warm-up', '02. peak time', '03. cool-down'];
const descItems = [
  { term: 'role', description: 'DJ / VJ' },
  { term: 'genre', description: 'techno, ambient, noise' },
  { term: 'equipment', description: 'Technics SL-1200, Pioneer DJM-900' },
];

const ListShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>List</h1>
      <section aria-label="Unordered list">
        <p className={subHeading}>unordered</p>
        <List items={unorderedItems} />
      </section>
      <section aria-label="Ordered list">
        <p className={subHeading}>ordered</p>
        <List ordered items={orderedItems} />
      </section>
      <section aria-label="Description list">
        <p className={subHeading}>description list</p>
        <DescriptionList items={descItems} />
      </section>
    </main>
  );
};

export default ListShowcase;
