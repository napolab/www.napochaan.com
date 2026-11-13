import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { sharedLifeEngine, useLifeState } from './index';

// Each Astro island is its own React root. The backdrop island (GameOfLife) ticks the
// engine and the SysBar island reads its generation, so with no provider in either
// root both must observe the same module-level engine.
const Generation = ({ id }: { id: string }) => {
  const state = useLifeState();

  return <output data-testid={id}>{`${state.generation}`}</output>;
};

describe('sharedLifeEngine across React roots', () => {
  it('lets two separate roots observe the same tick', async () => {
    // vitest-browser-react mounts every render() call into its own createRoot.
    await render(<Generation id="island-a" />);
    await render(<Generation id="island-b" />);
    const before = sharedLifeEngine.getState().generation;

    sharedLifeEngine.tick();

    await expect.element(page.getByTestId('island-a')).toHaveTextContent(`${before + 1}`);
    await expect.element(page.getByTestId('island-b')).toHaveTextContent(`${before + 1}`);
  });
});
