// A cms response outside the statuses an adapter handles (404 / 403 are mapped
// to "absent"). Thrown so the page's error boundary takes over.
export class CMSResponseError extends Error {
  override readonly name = 'CMSResponseError';
  readonly status: number;
  readonly route: string;

  constructor(route: string, status: number) {
    super(`CMS request ${route} failed with status ${status}`);
    this.status = status;
    this.route = route;
  }
}

type StatusResponse = { ok: boolean; status: number };

// The RPC response types only list the statuses a route declares (a 5xx is
// invisible to them), so check `ok` at runtime and narrow the response union to
// its success member (dropping e.g. the validator's 400) for the caller.
export const assertOK: <T extends StatusResponse>(route: string, res: T) => asserts res is Extract<T, { ok: true }> = (route, res) => {
  if (!res.ok) throw new CMSResponseError(route, res.status);
};
