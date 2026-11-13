'use client';

import { createContext, useContext } from 'react';

import { containerPlacement, type Placement } from './placement';

// The Placement (./placement) injected through context for the React cursor layer.
const PlacementContext = createContext<Placement>(containerPlacement);

export const PlacementProvider = PlacementContext.Provider;

export const usePlacement = (): Placement => useContext(PlacementContext);
