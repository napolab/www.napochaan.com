import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { createLifeEngine } from '@components/game-of-life/engine';

import { LifeEngineProvider, useLifeEngine, useLifeState } from './index';

const GenerationDisplay = () => {
  const state = useLifeState();
  return <div data-testid="generation">{`${state.generation}`}</div>;
};

const EngineDisplay = () => {
  const engine = useLifeEngine();
  return <div data-testid="engine">{engine !== null && engine !== undefined ? 'has-engine' : 'no-engine'}</div>;
};

describe('LifeEngineProvider', () => {
  it('renders generation from useLifeState', async () => {
    const engine = createLifeEngine({ cols: 4, rows: 4 });
    render(
      <LifeEngineProvider engine={engine}>
        <GenerationDisplay />
      </LifeEngineProvider>,
    );
    await expect.element(page.getByTestId('generation')).toHaveTextContent('0');
  });

  it('useLifeState updates when engine ticks', async () => {
    const engine = createLifeEngine({ cols: 4, rows: 4 });
    render(
      <LifeEngineProvider engine={engine}>
        <GenerationDisplay />
      </LifeEngineProvider>,
    );

    engine.tick();

    await expect.poll(() => page.getByTestId('generation').element().textContent).toBe('1');
  });

  it('useLifeEngine returns the provided engine', async () => {
    const engine = createLifeEngine({ cols: 4, rows: 4 });
    render(
      <LifeEngineProvider engine={engine}>
        <EngineDisplay />
      </LifeEngineProvider>,
    );
    await expect.element(page.getByTestId('engine')).toHaveTextContent('has-engine');
  });
});
