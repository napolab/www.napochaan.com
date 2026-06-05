import { css } from '@styled/css';

import { Card } from '@components/card';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const grid = css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'element' });
const cardHeading = css({ fontFamily: 'display', fontSize: 'h3', mb: '2' });
const cardBody = css({ fontFamily: 'body', fontSize: 'sm', color: 'fg.muted' });

const CardShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Card</h1>
      <section className={grid}>
        <Card>
          <h3 className={cardHeading}>night vol.13</h3>
          <p className={cardBody}>2024.03.15 at Club Eleven</p>
        </Card>
        <Card>
          <h3 className={cardHeading}>dawn session</h3>
          <p className={cardBody}>2024.04.20 at Warehouse</p>
        </Card>
        <Card as="div">
          <h3 className={cardHeading}>as div</h3>
          <p className={cardBody}>rendered as a div element</p>
        </Card>
      </section>
    </main>
  );
};

export default CardShowcase;
