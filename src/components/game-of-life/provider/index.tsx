'use client';

import { createContext, useContext, useState, useSyncExternalStore } from 'react';

import { createLifeEngine, type LifeEngine, type LifeState } from '../engine';

import type { ReactNode } from 'react';

// `density: 0` keeps the placeholder engine deterministic: it seeds NO live cells
// instead of calling Math.random at construction. The bar (useLifeState) renders
// this engine during SSR and again on the client's first paint — a random seed
// would make the two differ (alive 0 vs 1) and fail hydration. The real grid is
// seeded later, client-side, when GameOfLife measures the viewport and calls
// engine.resize (which always uses RESEED_DENSITY).
const PLACEHOLDER = { cols: 1, rows: 1, density: 0 } as const;

const defaultEngine = createLifeEngine(PLACEHOLDER);

const LifeEngineContext = createContext<LifeEngine>(defaultEngine);

type LifeEngineProviderProps = {
  children: ReactNode;
  engine?: LifeEngine;
};

export const LifeEngineProvider = ({ children, engine: engineProp }: LifeEngineProviderProps) => {
  const [engine] = useState(() => engineProp ?? createLifeEngine(PLACEHOLDER));
  return <LifeEngineContext value={engine}>{children}</LifeEngineContext>;
};

export const useLifeEngine = (): LifeEngine => useContext(LifeEngineContext);

export const useLifeState = (): LifeState => {
  const engine = useLifeEngine();
  return useSyncExternalStore(engine.subscribe, engine.getState, engine.getState);
};
