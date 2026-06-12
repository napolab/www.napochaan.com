// SATORI-LAND: this file renders for next/og (Satori), NOT the DOM. It therefore
// uses inline `style` objects (no Panda CSS, no @components/image) and only
// flexbox layout — Satori supports neither CSS grid nor `word-break: auto-phrase`,
// and absolute-positioned page structure can fail to converge, so the main split
// is a flex row (only the GoL cells use absolute, inside a relative field).
import type { OgCardData } from '../resolve-og-card-data';
import type { OgLifeBoard } from '../og-life-board';

export const SIZE = { width: 1200, height: 630 } as const;
export const CONTENT_TYPE = 'image/png' as const;

// Satori does NOT support oklch() — use sRGB hex equivalents of the design tokens
// (gray.12 / gray.1 / gray.11 / gray.9 / blue.9 / red.9).
const INK = '#0e131c';
const CANVAS = '#eeeff2';
const MUTED = '#4b505a';
const SUBTLE = '#70757e';
const BLUE = '#1a34ff';
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
      <div style={{ flex: 1, height: '100%', display: 'flex', borderLeft: `2px solid ${INK}` }}>
        <img src={data.imageUrl} width={SIZE.width - COL_W} height={SIZE.height} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, height: '100%', position: 'relative', display: 'flex', borderLeft: `2px solid ${INK}` }}>
      {board.cells.map((c) => (
        <div key={`${c.x}-${c.y}`} style={{ position: 'absolute', left: c.x * CELL + 1, top: c.y * CELL + 1, width: CELL - 2, height: CELL - 2, background: c.red ? RED_CELL : BLUE_CELL }} />
      ))}
      <div style={{ position: 'absolute', left: 24, top: 36, display: 'flex', fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: BLUE }}>{`alive ${board.alive}`}</div>
      <div style={{ position: 'absolute', right: 36, bottom: 32, display: 'flex', fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: BLUE }}>gen 0042</div>
    </div>
  );
};

// Returns the Satori element tree. Exported as a plain function (not a React
// component) so the route can pass it straight to ImageResponse.
export const OgCard = ({ data, wordmarkUrl, board }: Props) => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', background: CANVAS, color: INK }}>
      {/* left info column */}
      <div
        style={{
          width: COL_W,
          flexShrink: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 40,
          background: CANVAS,
          borderRight: `2px solid ${INK}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: MUTED }}>NAPOCHAAN.COM</div>
          <div style={{ display: 'flex', marginTop: 22 }}>
            <div style={{ background: BLUE, color: '#fff', padding: '5px 12px', fontFamily: MONO, fontSize: 15 }}>{data.label}</div>
          </div>
          <div style={{ marginTop: 18, fontFamily: JP, fontWeight: 700, fontSize: 30, lineHeight: 1.28, letterSpacing: '-0.02em' }}>{data.title.chunks.join('')}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <img src={wordmarkUrl} width={344} height={84} style={{ width: 344, height: 84 }} />
          <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: SUBTLE }}>{data.meta}</div>
        </div>
      </div>

      <Field data={data} board={board} />
    </div>
  );
};
