import { css } from '@styled/css';

import { Tag } from '@components/tag';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const row = css({ display: 'flex', gap: 'element', alignItems: 'center', flexWrap: 'wrap' });

const TagShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Tag</h1>
      <section className={row}>
        <Tag tone="default">flyer</Tag>
        <Tag tone="blue">live</Tag>
        <Tag tone="outline">event</Tag>
      </section>
      <section className={row}>
        <Tag tone="default">design</Tag>
        <Tag tone="blue">music</Tag>
        <Tag tone="outline">installation</Tag>
      </section>
    </main>
  );
};

export default TagShowcase;
