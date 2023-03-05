export const clsx = (...classNames: (string | undefined)[]) => classNames.filter((c) => c !== undefined).join(" ");
