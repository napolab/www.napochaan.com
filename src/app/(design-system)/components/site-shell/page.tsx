import { css } from '@styled/css';

import { SiteShell } from '@components/site-shell';

const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });
const note = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.subtle', marginTop: 'element' });

const SiteShellShowcase = () => {
  return (
    <SiteShell>
      <main>
        <h1 className={heading}>SiteShell</h1>
        <section aria-label="Description">
          <p className={caption}>
            SiteShell composes three layers: a fixed 4-edge TypographyBand frame (24px bands at top/bottom/left/right), a fixed full-bleed GameOfLife canvas background, and an inset content stage. The
            stage applies paddingBlock: 44px (band 24px + 20px breathing room) and paddingInline: 48px (band 24px + page gutter 24px) so page content never sits under the bands. The stage is centered
            at max-width 1180px.
          </p>
          <p className={note}>
            Note: In this showcase, TypographyBand and GameOfLife are rendered fixed / full-bleed as they would appear in the real site layout. The content you see here is inside the inset stage.
          </p>
        </section>
      </main>
    </SiteShell>
  );
};

export default SiteShellShowcase;
