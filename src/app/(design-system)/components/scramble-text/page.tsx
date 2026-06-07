'use client';

import { useState } from 'react';

import { css } from '@styled/css';

import { ScrambleText } from '@components/scramble-text';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });
const preview = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'section' });

// A whole-card link so the `group` trigger has a host element to reference.
const cardStyle = css({
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
  const [card, setCard] = useState<HTMLAnchorElement | null>(null);

  return (
    <main className={wrap}>
      <h1 className={heading}>ScrambleText</h1>

      <section aria-label="self trigger">
        <div className={preview}>
          <a href="#x" className={selfLink}>
            <ScrambleText>hover this title</ScrambleText>
          </a>
        </div>
        <p className={caption}>default (trigger=&quot;self&quot;) — the text decodes on its own hover. Used where the title text is itself the link (news / blog list rows).</p>
      </section>

      <section aria-label="group trigger">
        <div className={preview}>
          <a ref={setCard} href="#y" className={cardStyle} aria-label="static internet">
            <ScrambleText trigger="group" host={card} className={titleInk}>
              static internet
            </ScrambleText>
            <span className={cardMeta}>hover anywhere on the card</span>
          </a>
        </div>
        <p className={caption}>trigger=&quot;group&quot; + groupRef — the title decodes when the referenced element (the whole card) is hovered. The host is passed explicitly; no DOM traversal.</p>
      </section>
    </main>
  );
};

export default ScrambleTextShowcase;
