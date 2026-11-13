'use client';

import { createContext, useContext } from 'react';

import { containerResizer, type Resizer } from './container-resizer';

// The Resizer (./container-resizer) injected via context so the size source is
// swappable in React trees (a test mock, a viewport strategy, …). Custom elements use
// ./container-resizer directly.
const ResizerContext = createContext<Resizer>(containerResizer);

export const ResizerProvider = ResizerContext.Provider;

export const useResizer = (): Resizer => useContext(ResizerContext);
