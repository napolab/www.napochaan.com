// SATORI-LAND: this file renders for next/og (Satori), NOT the DOM. It therefore
// uses inline `style` objects (no Panda CSS, no @components/image) and only
// flexbox layout — Satori supports neither CSS grid nor `word-break: auto-phrase`.
import type { OgCardData } from '../resolve-og-card-data';
import type { OgLifeBoard } from '../og-life-board';

export const SIZE = { width: 1200, height: 630 } as const;
export const CONTENT_TYPE = 'image/png' as const;

const INK = 'oklch(0.185 0.020 265)';
const CANVAS = 'oklch(0.952 0.004 265)';
const MUTED = 'oklch(0.430 0.018 265)';
const SUBTLE = 'oklch(0.560 0.016 265)';
const BLUE = 'rgb(26,52,255)';
const BLUE_CELL = 'rgba(26,52,255,0.92)';
const RED_CELL = 'rgba(255,0,43,0.85)';
const COL_W = 432;
const CELL = 24;
const MONO = 'Geist Mono';
const JP = 'LINE Seed JP';

type Props = {
  data: OgCardData;
  wordmarkUrl: string; // data: URL or absolute URL of the digibop PNG
  board: OgLifeBoard; // GoL board for the field (used when !hasImage)
};

const Field = ({ data, board }: { data: OgCardData; board: OgLifeBoard }) => {
  if (data.hasImage) {
    return (
      <div style={{ position: 'absolute', left: COL_W, top: 0, right: 0, bottom: 0, display: 'flex', borderLeft: `2px solid ${INK}` }}>
        <img src={data.imageUrl} width={1200 - COL_W} height={630} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', left: COL_W, top: 0, right: 0, bottom: 0, display: 'flex' }}>
      {board.cells.map((c) => (
        <div key={`${c.x}-${c.y}`} style={{ position: 'absolute', left: c.x * CELL + 1, top: c.y * CELL + 1, width: CELL - 2, height: CELL - 2, background: c.red ? RED_CELL : BLUE_CELL }} />
      ))}
    </div>
  );
};

// Returns the Satori element tree. Exported as a plain function (not a JSX
// component used by React) so the route can pass it straight to ImageResponse.
export const OgCard = ({ data, wordmarkUrl, board }: Props) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', background: CANVAS, color: INK }}>
      <Field data={data} board={board} />

      {/* left info column */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: COL_W, display: 'flex', flexDirection: 'column', padding: 40, background: CANVAS, borderRight: `2px solid ${INK}` }}>
        <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: MUTED }}>NAPOCHAAN.COM</div>
        <div style={{ display: 'flex', marginTop: 22 }}>
          <div style={{ background: BLUE, color: '#fff', padding: '5px 12px', fontFamily: MONO, fontSize: 15 }}>{data.label}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 18, fontFamily: JP, fontWeight: 700, fontSize: 33, lineHeight: 1.24, letterSpacing: '-0.02em' }}>
          {data.title.chunks.map((chunk, i) => (
            <span key={`${i}-${chunk}`} style={{ whiteSpace: 'nowrap' }}>
              {chunk}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', marginTop: 'auto' }}>
          <img src={wordmarkUrl} width={344} height={84} style={{ width: 344, height: 'auto' }} />
        </div>
        <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: SUBTLE }}>{data.meta}</div>
      </div>

      {/* field system text (only meaningful for the GoL state) */}
      <div style={{ position: 'absolute', left: COL_W + 28, top: 40, display: 'flex', fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: BLUE }}>{`alive ${board.alive}`}</div>
      <div style={{ position: 'absolute', right: 44, bottom: 40, display: 'flex', fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: data.hasImage ? '#fff' : BLUE }}>gen 0042</div>
    </div>
  );
};
