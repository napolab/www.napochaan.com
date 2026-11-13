/** Seamless wrap: maps any offset into the (-range, 0] window for a duplicated track. */
export const wrap = (value: number, range: number): number => {
  if (range === 0) return 0;
  const mod = value % range;
  return mod > 0 ? mod - range : mod;
};
