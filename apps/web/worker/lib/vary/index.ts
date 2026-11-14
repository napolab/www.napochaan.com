const splitFields = (vary: string): readonly string[] =>
  vary
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field !== '');

// Adds `field` to a Vary value without dropping what is already listed. `*` already varies
// on everything, and a field already present (case-insensitive) is not repeated.
export const appendVary = (existing: string | null, field: string): string => {
  const fields = splitFields(existing ?? '');
  if (fields.length === 0) return field;
  const lowered = fields.map((name) => name.toLowerCase());
  if (lowered.includes('*') || lowered.includes(field.toLowerCase())) return fields.join(', ');

  return [...fields, field].join(', ');
};
