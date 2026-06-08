import { css } from '@styled/css';

import { CursorPresence } from '@components/cursor-presence';
import { CursorSurface } from '@components/cursor-presence/cursor-surface';

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
          <CursorSurface className={surface}>cursor surface</CursorSurface>
          <p className={caption}>
            同じページを開いている閲覧者のカーソルをリアルタイム共有。WebSocket・訪問者 state・送信スロットルは framework-agnostic な headless container（createVisitorPointerApp()）に集約。React は
            useSyncExternalStore で購読し、カーソルは &lt;canvas&gt; オーバーレイに描画するだけ。pointer:fine デバイスのみ送信。prefers-reduced-motion 時はカーソル移動アニメーションを無効化。単一の DO
            room を共有し各カーソルに現在 pathname を持たせてサーバー側でページ単位にルーティングするため、別ページ閲覧者とは混在しません。
          </p>
        </section>
        <section aria-label="VisitorPointerApp">
          <h2
            className={css({
              fontFamily: 'display',
              fontSize: 'h3',
              marginBottom: 'element',
            })}
          >
            createVisitorPointerApp()
          </h2>
          <PresenceProbe />
          <p className={caption}>
            headless API — start() / end() で WebSocket の開閉を制御（React 側は useEffect 内で setTimeout 遅延 start により StrictMode の二重マウントを回避）。send(position) で正規化座標（surface
            比率）を送信（内部で 50ms スロットル）。getState() / subscribe(listener) で購読。React 非依存の plain TS。usePresence() は
            count（同一ページの接続数）・enabled（送受信トグル）・toggle()（localStorage 永続化）を公開。
          </p>
        </section>
      </main>
    </CursorPresence>
  );
};

export default CursorPresenceShowcase;
