import { css } from '@styled/css';

import { CursorPresence } from '@components/cursor-presence';

import { PresenceProbe } from './_probe';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });
const surface = css({
  position: 'relative',
  width: 'full',
  height: '[200px]',
  borderWidth: 'default',
  borderStyle: 'dashed',
  borderColor: 'border.default',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});

const CursorPresenceShowcase = () => {
  return (
    <CursorPresence>
      <main className={wrap}>
        <h1 className={heading}>CursorPresence</h1>
        <section aria-label="Preview">
          <div data-cursor-surface className={surface}>
            cursor surface
          </div>
          <p className={caption}>
            同じページを開いている閲覧者のカーソルをリアルタイム共有。他者カーソルは live WebSocket + 他の閲覧者がいる時のみ表示されます。pointer:fine デバイスのみ送信。prefers-reduced-motion
            時はカーソル移動アニメーションを無効化。ページ単位の room に分離されるため、別ページ閲覧者とは混在しません。
          </p>
        </section>
        <section aria-label="Presence API">
          <h2
            className={css({
              fontFamily: 'display',
              fontSize: 'h3',
              marginBottom: 'element',
            })}
          >
            usePresence()
          </h2>
          <PresenceProbe />
          <p className={caption}>count — 同一ルームの接続数。enabled — カーソル送受信トグル。toggle() — on/off 切り替え（localStorage に永続化）。</p>
        </section>
      </main>
    </CursorPresence>
  );
};

export default CursorPresenceShowcase;
