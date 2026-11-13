import { flushSync } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
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

  it('hydrates a later island without a mismatch after an earlier island advanced the engine', async () => {
    // The backdrop island hydrates first and seeds / ticks the engine; the SysBar
    // island's SSR markup still shows the placeholder, so hydration must read the
    // placeholder snapshot and only then switch to the live state.
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Generation id="late-island" />);
    document.body.appendChild(container);
    sharedLifeEngine.tick();
    const onRecoverableError = vi.fn();

    flushSync(() => {
      hydrateRoot(container, <Generation id="late-island" />, { onRecoverableError });
    });

    await expect.element(page.getByTestId('late-island')).toHaveTextContent(`${sharedLifeEngine.getState().generation}`);
    expect(onRecoverableError).not.toHaveBeenCalled();
    container.remove();
  });
});
