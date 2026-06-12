// SATORI-LAND: this file renders for next/og (Satori), NOT the DOM. It therefore
// uses inline `style` objects (no Panda CSS, no @components/image), only flexbox
// layout (no CSS grid, no `word-break`), and sRGB hex/rgba colors — Satori does
// NOT parse oklch().
import type { OgCardData } from '../resolve-og-card-data';
import type { OgLifeBoard } from '../og-life-board';

export const SIZE = { width: 1200, height: 630 } as const;
export const CONTENT_TYPE = 'image/png' as const;

const INK = '#0e131c'; // gray.12
const CANVAS = '#eeeff2'; // gray.1
const MUTED = '#4b505a'; // gray.11
const SUBTLE = '#70757e'; // gray.9
const BLUE = '#1a34ff'; // blue.9
const BLUE_FAINT = 'rgba(26,52,255,0.16)'; // faint GoL cell (≈ production background)
const RED_FAINT = 'rgba(255,0,43,0.16)';
const COL_W = 432;
const CELL = 56; // large, faint background cells
const MONO = 'Geist Mono';
const JP = 'LINE Seed JP';

type Props = {
  data: OgCardData;
  wordmarkUrl: string; // data: URL or absolute URL of the digibop PNG
  board: OgLifeBoard; // full-card GoL board (faint background texture)
};

// Returns the Satori element tree. Exported as a plain function (not a React
// component) so the route can pass it straight to ImageResponse.
export const OgCard = ({ data, wordmarkUrl, board }: Props) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', background: CANVAS, color: INK }}>
      {/* faint, large Game-of-Life texture across the whole card */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex' }}>
        {board.cells.map((c) => (
          <div key={`${c.x}-${c.y}`} style={{ position: 'absolute', left: c.x * CELL + 2, top: c.y * CELL + 2, width: CELL - 4, height: CELL - 4, background: c.red ? RED_FAINT : BLUE_FAINT }} />
        ))}
      </div>

      {/* foreground: info column + right field */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'row' }}>
        <div
          style={{
            width: COL_W,
            flexShrink: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 40,
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

        <div style={{ flex: 1, height: '100%', position: 'relative', display: 'flex' }}>
          {data.hasImage ? (
            <img src={data.imageUrl} width={SIZE.width - COL_W} height={SIZE.height} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex' }}>
              <div style={{ position: 'absolute', left: 28, top: 36, display: 'flex', fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: BLUE }}>{`alive ${board.alive}`}</div>
              <div style={{ position: 'absolute', right: 36, bottom: 32, display: 'flex', fontFamily: MONO, fontSize: 12, letterSpacing: 2, color: BLUE }}>gen 0042</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
