'use client';

import { createContext, useContext, useState, useSyncExternalStore } from 'react';

import { createLifeEngine, type LifeEngine, type LifeState } from '../engine';

import type { ReactNode } from 'react';

const defaultEngine = createLifeEngine({ cols: 1, rows: 1 });

const LifeEngineContext = createContext<LifeEngine>(defaultEngine);

type LifeEngineProviderProps = {
  children: ReactNode;
  engine?: LifeEngine;
};

export const LifeEngineProvider = ({ children, engine: engineProp }: LifeEngineProviderProps) => {
  const [engine] = useState(() => engineProp ?? createLifeEngine({ cols: 1, rows: 1 }));
  return <LifeEngineContext value={engine}>{children}</LifeEngineContext>;
};

export const useLifeEngine = (): LifeEngine => useContext(LifeEngineContext);

export const useLifeState = (): LifeState => {
  const engine = useLifeEngine();
  return useSyncExternalStore(engine.subscribe, engine.getState, engine.getState);
};
