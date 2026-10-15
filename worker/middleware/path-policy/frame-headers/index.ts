const isBlank = (value: string): boolean => value.trim() === '';

const hasFrameAncestors = (csp: string): boolean => csp.split(';').some((directive) => directive.trim().toLowerCase().startsWith('frame-ancestors'));

const appendDirective = (csp: string, directive: string): string => `${csp.replace(/;\s*$/, '')}; ${directive}`;

// 上流の CSP は壊さない。frame-ancestors を持たない時だけ末尾に足す。
export const resolveCSP = (existing: string | null, frameAncestors: string): string => {
  if (existing === null || isBlank(existing)) return frameAncestors;
  if (hasFrameAncestors(existing)) return existing;

  return appendDirective(existing, frameAncestors);
};
