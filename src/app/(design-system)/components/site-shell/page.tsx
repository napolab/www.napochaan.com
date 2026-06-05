import { css } from '@styled/css';

import { SiteShell } from '@components/site-shell';

const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element', maxWidth: '[60ch]' });
const note = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.subtle', marginTop: 'element', maxWidth: '[60ch]' });
const filler = css({ fontFamily: 'body', fontSize: 'md', lineHeight: 'jp', color: 'fg.muted', marginTop: 'block', maxWidth: '[60ch]' });
const row = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.subtle', paddingBlock: '1' });

const FILLER_LINES = Array.from({ length: 28 }, (_unused, i) => i);

const SiteShellShowcase = () => {
  return (
    <SiteShell>
      <main>
        <h1 className={heading}>SiteShell</h1>
        <section aria-label="Description">
          <p className={caption}>
            SiteShell composes three layers: a fixed 4-edge TypographyBand frame (24px bands at top/bottom/left/right), a fixed full-bleed GameOfLife canvas background, and an inset content stage
            (paddingBlock 44px / paddingInline 48px, centered at max-width 1180px) so content never sits under the bands.
          </p>
          <p className={note}>
            Scroll this page — the TypographyBand reacts to scroll velocity (top ← / right ↑ / bottom → / left ↓), while content scrolls under the fixed bands and the living grid.
          </p>
        </section>
        <section aria-label="Scrollable demo content">
          <p className={filler}>
            ↓ デモ用の長いコンテンツです。スクロールすると四辺のタイポバンドが速度に反応して流れ、背景の Game of Life が明滅しているのが確認できます。コンテンツは inset stage
            の中に収まり、固定された帯の下を流れます。
          </p>
          {FILLER_LINES.map((i) => (
            <p key={i} className={row}>
              {`${`${i + 1}`.padStart(2, '0')} · scroll to drive the band · gen/alive ticking in the background · 5470009 · since 2020`}
            </p>
          ))}
          <p className={filler}>↑ ここまでスクロールすると、帯が時計回りに回転しながら流れたのが分かります。</p>
        </section>
      </main>
    </SiteShell>
  );
};

export default SiteShellShowcase;
