import { css } from '@styled/css';

import { Heading } from '@components/heading';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const row = css({ display: 'flex', flexDirection: 'column', gap: 'element' });

const HeadingShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={css({ fontFamily: 'display', fontSize: 'h2' })}>Heading</h1>
      <section className={row} aria-label="Level scale">
        <Heading level={1}>h1 — Display heading</Heading>
        <Heading level={2}>h2 — Section heading</Heading>
        <Heading level={3}>h3 — Subsection heading</Heading>
        <Heading level={4}>h4 — Group heading</Heading>
        <Heading level={5}>h5 — Detail heading</Heading>
        <Heading level={6}>h6 — Minor heading</Heading>
      </section>
    </main>
  );
};

export default HeadingShowcase;
