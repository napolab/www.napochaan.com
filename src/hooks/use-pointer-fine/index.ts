'use client';

import { useSyncExternalStore } from 'react';

import { pointerFine, subscribePointerFine } from '@utils/pointer-fine';

const getServerSnapshot = (): boolean => false;

// Live snapshot of `(pointer: fine)`. SSR defaults to false (touch-safe) so the
// interactive layer only attaches after hydration confirms a fine pointer.
export const usePointerFine = (): boolean => useSyncExternalStore(subscribePointerFine, pointerFine, getServerSnapshot);
