import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BLANK_DIM_TAG, defineBlankDimElement } from './element';

// A sized cell holding the markup blank-dim.astro renders (the span is absolutely
// positioned over the cell, as styles.blankDim does).
const mount = (width: number, height: number) => {
  const cell = document.createElement('div');
  cell.style.cssText = `position: relative; width: ${width}px; height: ${height}px;`;
  cell.innerHTML = `<${BLANK_DIM_TAG} ref-label="07"><span aria-hidden="true" style="position: absolute; inset: 0;">NO.07</span></${BLANK_DIM_TAG}>`;
  document.body.appendChild(cell);
  const label = cell.querySelector('span');
  if (label === null) throw new Error('label not rendered');
  return { cell, label };
};

describe('<blank-dim>', () => {
  beforeEach(() => {
    defineBlankDimElement();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('labels the cell with its measured size above the reference number', async () => {
    const { label } = mount(320, 180);
    await expect.poll(() => label.textContent).toBe('320×180\nNO.07');
  });

  it('re-measures when the cell resizes', async () => {
    const { cell, label } = mount(320, 180);
    await expect.poll(() => label.textContent).toBe('320×180\nNO.07');
    cell.style.width = '200px';
    await expect.poll(() => label.textContent).toBe('200×180\nNO.07');
  });

  it('keeps only the reference number while the cell has no width', async () => {
    const { label } = mount(0, 180);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(label.textContent).toBe('NO.07');
  });
});
