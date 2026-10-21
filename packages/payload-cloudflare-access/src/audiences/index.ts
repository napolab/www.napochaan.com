export const parseAudiences = (raw: string | undefined): readonly string[] =>
  (raw ?? '')
    .split(',')
    .map((audience) => audience.trim())
    .filter((audience) => audience !== '');
