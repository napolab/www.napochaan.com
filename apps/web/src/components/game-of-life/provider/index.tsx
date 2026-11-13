'use client';

import { createContext, useContext, useState, useSyncExternalStore } from 'react';

import { createPlaceholderLifeEngine, sharedLifeEngine } from '../shared-engine';

import type { LifeEngine, LifeState } from '../engine';

import type { ReactNode } from 'react';

// React roots without a LifeEngineProvider read the module-level engine
// (../shared-engine) the <game-of-life> and <sys-bar> elements share.
const LifeEngineContext = createContext<LifeEngine>(sharedLifeEngine);

type LifeEngineProviderProps = {
  children: ReactNode;
  engine?: LifeEngine;
};

export const LifeEngineProvider = ({ children, engine: engineProp }: LifeEngineProviderProps) => {
  const [engine] = useState(() => engineProp ?? createPlaceholderLifeEngine());
  return <LifeEngineContext value={engine}>{children}</LifeEngineContext>;
};

export const useLifeEngine = (): LifeEngine => useContext(LifeEngineContext);

// The SSR snapshot is always the empty placeholder, never the live engine: a root may
// hydrate after the <game-of-life> element already seeded and ticked the shared
// engine. Hydrating against the placeholder matches the server markup; React then
// re-renders with the live state.
const PLACEHOLDER_STATE = createPlaceholderLifeEngine().getState();
const getPlaceholderState = (): LifeState => PLACEHOLDER_STATE;

export const useLifeState = (): LifeState => {
  const engine = useLifeEngine();
  return useSyncExternalStore(engine.subscribe, engine.getState, getPlaceholderState);
};
