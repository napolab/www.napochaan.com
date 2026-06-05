import { css } from '@styled/css';

import { Divider } from '@components/divider';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const sectionRoot = css({ display: 'flex', flexDirection: 'column', gap: 'element' });
const label = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted' });
const inlineRow = css({ display: 'flex', alignItems: 'center', gap: 'element' });
const inlineText = css({ fontFamily: 'mono', fontSize: 'sm', color: 'fg.default' });

const DividerShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>Divider</h1>
      <section className={sectionRoot} aria-label="Variants">
        <span className={label}>horizontal — solid (default)</span>
        <Divider />
        <span className={label}>horizontal — dashed</span>
        <Divider variant="dashed" />
        <span className={label}>vertical — between inline items</span>
        <div className={inlineRow}>
          <span className={inlineText}>left</span>
          <Divider orientation="vertical" />
          <span className={inlineText}>right</span>
        </div>
      </section>
    </main>
  );
};

export default DividerShowcase;
