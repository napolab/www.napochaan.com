import { css } from '@styled/css';

import { LifeEngineProvider } from '@components/game-of-life/provider';
import { SysBar } from '@components/sys-bar';

const wrap = css({ position: 'relative', zIndex: 'dropdown', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });

const SysBarShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>SysBar</h1>
      <section aria-label="Preview">
        <LifeEngineProvider>
          <SysBar />
        </LifeEngineProvider>
        <p className={caption}>
          The site header: a mono nav (index / about / works / live / gallery / blog) paired with a live status line — a HH:mm:ss clock in Asia/Tokyo, the Game-of-Life generation and alive counts, and
          a ● rec marker. A decorative conic-gradient checker strip sits below. The clock is driven by useSyncExternalStore over a shared interval; the gen/alive figures come from useLifeState.
        </p>
      </section>
    </main>
  );
};

export default SysBarShowcase;
