import type { CacheDirective } from '../types';

export const KEEP: CacheDirective = { kind: 'keep' };

export const fillWith = (policy: string): CacheDirective => ({ kind: 'fill', policy });

export const pageWith = (policy: string): CacheDirective => ({ kind: 'page', policy });

export const denyWith = (policy: string): CacheDirective => ({ kind: 'deny', policy });
