import type { ResultAsync } from 'neverthrow';

export type FetchContext = {
  url: URL;
  origin: string;
  fetchUrl: string;
  env: Cloudflare.Env;
  fetchOptions: RequestInit;
};

export type ImageFetcher = {
  run: (ctx: FetchContext) => ResultAsync<Response, void>;
};
