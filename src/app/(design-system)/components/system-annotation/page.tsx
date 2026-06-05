import { css } from '@styled/css';

import { SystemAnnotation } from '@components/system-annotation';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const row = css({ display: 'flex', gap: 'element', alignItems: 'center', flexWrap: 'wrap' });

const SystemAnnotationShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>SystemAnnotation</h1>
      <section className={row}>
        <SystemAnnotation tone="muted">00:25AM</SystemAnnotation>
        <SystemAnnotation tone="accent">./boot --init</SystemAnnotation>
        <SystemAnnotation tone="danger">not found</SystemAnnotation>
      </section>
      <section className={row}>
        <SystemAnnotation tone="muted">sys.log: ready</SystemAnnotation>
        <SystemAnnotation tone="accent">status: ok</SystemAnnotation>
        <SystemAnnotation tone="danger">err: 404</SystemAnnotation>
      </section>
    </main>
  );
};

export default SystemAnnotationShowcase;
