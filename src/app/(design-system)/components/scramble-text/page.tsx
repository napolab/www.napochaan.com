import { css } from '@styled/css';

import { ScrambleText } from '@components/scramble-text';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });
const preview = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'section' });

// A whole-card link so the `group` trigger has an <a> ancestor to listen on.
const card = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'inline',
  padding: 'element',
  borderWidth: 'hairline',
  borderStyle: 'solid',
  borderColor: 'border.default',
  textDecorationLine: 'none',
});
const titleInk = css({ fontFamily: 'body', fontSize: 'lg', fontWeight: 'medium', color: 'accent.text' });
const cardMeta = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted' });
const selfLink = css({ fontFamily: 'body', fontSize: 'lg', color: 'accent.text' });

const ScrambleTextShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>ScrambleText</h1>

      <section aria-label="self trigger">
        <div className={preview}>
          <a href="#x" className={selfLink}>
            <ScrambleText trigger="self">hover this title</ScrambleText>
          </a>
        </div>
        <p className={caption}>trigger="self" — the text decodes on its own hover. Used where the title text is itself the link (news / blog list rows).</p>
      </section>

      <section aria-label="group trigger">
        <div className={preview}>
          <a href="#y" className={card} aria-label="static internet">
            <ScrambleText trigger="group" className={titleInk}>
              static internet
            </ScrambleText>
            <span className={cardMeta}>hover anywhere on the card</span>
          </a>
        </div>
        <p className={caption}>
          trigger="group" — the title decodes when the nearest ancestor &lt;a&gt; is hovered. Used for whole-card links (works archive / related rails). The card aria-label keeps the accessible name
          stable.
        </p>
      </section>
    </main>
  );
};

export default ScrambleTextShowcase;
