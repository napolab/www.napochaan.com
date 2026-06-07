import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ComponentDemo } from './index';

describe('ComponentDemo', () => {
  it('renders the name, the why and the live demo children', async () => {
    await render(
      <ComponentDemo name="Marquee" why="横に流れる帯。">
        <div>LIVE_DEMO</div>
      </ComponentDemo>,
    );

    await expect.element(page.getByText('Marquee')).toBeInTheDocument();
    await expect.element(page.getByText('横に流れる帯。')).toBeInTheDocument();
    await expect.element(page.getByText('LIVE_DEMO')).toBeInTheDocument();
  });
});
