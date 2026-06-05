import { css } from '@styled/css';

import { Button } from '@components/button';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const row = css({ display: 'flex', gap: 'element', alignItems: 'center', flexWrap: 'wrap' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });

const ButtonShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Button</h1>
      <section className={row} aria-label="Variants">
        <Button variant="solid">solid</Button>
        <Button variant="outline">outline</Button>
        <Button variant="danger">danger</Button>
        <Button variant="solid" isDisabled>
          disabled
        </Button>
      </section>
    </main>
  );
};

export default ButtonShowcase;
