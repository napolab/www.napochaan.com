import { Result } from 'neverthrow';
import { createFactory } from 'hono/factory';

import type { MountedFetch } from '../../worker-app';
import type { Context, ExecutionContext } from 'hono';

type HonoEnv = { Bindings: CloudflareEnv };

const MCP_API_PATH = '/api/mcp';

// forward 経由の応答はすべて Access JWT から特定した user ごとのデータなので、共有キャッシュに載せない。
export const PRIVATE_POLICY = 'private, no-store';

// app.request() で駆動するテストには ExecutionContext が無く、getter が throw する。
// Hono の mount と同じく、取れなければ undefined を渡す。
const readExecutionContext = (c: Context<HonoEnv>): ExecutionContext | undefined =>
  Result.fromThrowable(
    () => c.executionCtx,
    (cause) => cause,
  )().unwrapOr(undefined);

// /mcp・/mcp/* はどちらも /api/mcp 1 本に寄せる(/api/mcp/ だと Next の trailing slash 308 で POST が壊れる)。
// query は残す。
const toMCPAPIRequest = (request: Request): Request => {
  const url = new URL(request.url);
  url.pathname = MCP_API_PATH;
  return new Request(url, request);
};

// forward 経由の応答はすべて user ごとのデータなので、ここで既定を付ける(Hono が percent-decode して
// ここに届く /%6Dcp のような path も含む)。上流(Next)の値があればそれが勝つ。
// mount した handler の応答は headers が immutable なので、headers を複製して Response を組み直す。
const withPrivateCacheControl = (response: Response): Response => {
  if (response.headers.has('Cache-Control')) return response;

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', PRIVATE_POLICY);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// cms ホスト全体を Cloudflare Access(ホスト全体アプリ、Managed OAuth)が守っていて、通過したリクエストに
// Cf-Access-Jwt-Assertion が付く。ここは認証の判断をせず、method・header・body をそのまま
// in-process で Next の /api/mcp に渡すだけ。JWT の検証と user の特定は src/app/api/mcp/route.ts が行う。
// handlerFetch を直接呼ぶので Hono のルーティング(mcp-guard)は通らない。
export const createMCPRoutes = (handlerFetch: MountedFetch) => {
  const factory = createFactory<HonoEnv>();
  const app = factory.createApp();

  const forward = factory.createHandlers(async (c) => withPrivateCacheControl(await handlerFetch(toMCPAPIRequest(c.req.raw), c.env, readExecutionContext(c))));

  app.all('/mcp', ...forward);
  app.all('/mcp/*', ...forward);

  return app;
};
