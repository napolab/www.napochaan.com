import type { FetchLike } from '../fetch-markdown';

// The browser edges the tools need, injected so the tools stay testable.
export type WebMCPToolDeps = {
  fetch: FetchLike;
  navigate: (path: string) => void;
  // Read at execute time: the tools outlive ClientRouter soft navigations.
  getPathname: () => string;
  origin: string;
};
