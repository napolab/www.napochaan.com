import { css } from '@styled/css';

import { EchoText } from '@components/echo-text';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });
const preview = css({ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 'section' });

const EchoTextShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>EchoText</h1>
      <section aria-label="Examples">
        <div className={preview}>
          <EchoText>napochaan</EchoText>
        </div>
        <p className={caption}>Layered echo display — 3 typographic layers (outline echo, blue echo, filled foreground) stacked for a T2 display headline effect. Echo layers are aria-hidden.</p>
      </section>
    </main>
  );
};

export default EchoTextShowcase;
