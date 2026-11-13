import { useSyncExternalStore } from 'react';

const noop = () => () => {};
const getClient = () => true;
const getServer = () => false;

export const useIsClient = () => useSyncExternalStore(noop, getClient, getServer);
