// The SysBar status-row texts, shared by the React SysBar (reference markup), the
// `.astro` twin (server values) and the <sys-bar> element (live values), so the three
// never drift.

export const genText = (generation: number): string => `gen ${`${generation}`.padStart(4, '0')}`;

export const aliveText = (alive: number): string => `alive ${alive}`;

export const watchingText = (count: number): string => `watching ${count}`;

export const cursorsText = (enabled: boolean): string => (enabled ? 'cursors: on' : 'cursors: off');

export const motionText = (reduced: boolean): string => (reduced ? 'motion: off' : 'motion: on');
