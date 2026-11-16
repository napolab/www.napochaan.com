// One named argument out of the agent's JSON-parsed input, still `unknown`: the
// caller narrows it (schemas are advisory; the browser does not enforce them).
export const readField = (input: unknown, key: string): unknown => {
  if (typeof input !== 'object' || input === null) return undefined;
  const value: unknown = Reflect.get(input, key);

  return value;
};
