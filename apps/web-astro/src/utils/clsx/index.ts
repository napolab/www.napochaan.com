export const clsx = (...values: (string | undefined)[]): string => values.filter((value) => value !== undefined && value !== '').join(' ');
