import { css } from '@styled/css';

import { Badge } from '@components/badge';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const row = css({ display: 'flex', gap: 'element', alignItems: 'center', flexWrap: 'wrap' });

const BadgeShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Badge</h1>
      <section className={row} aria-label="Tones">
        <Badge tone="accent">now playing</Badge>
        <Badge tone="danger">rec</Badge>
        <Badge tone="neutral">offline</Badge>
      </section>
      <section className={row} aria-label="Examples">
        <Badge tone="accent">live</Badge>
        <Badge tone="danger">error</Badge>
        <Badge tone="neutral">idle</Badge>
      </section>
    </main>
  );
};

export default BadgeShowcase;
