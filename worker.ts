import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cache } from "hono/cache";
import z from "zod";

// @ts-ignore
import handler from "./.open-next/worker.js";
import nextImageConfig from "./next-image.config.js";

type HonoEnv = {
  Bindings: Env;
};

const app = new Hono<HonoEnv>();
const Format = z.union([z.literal("avif"), z.literal("webp"), z.literal("jpeg"), z.literal("png")]);

const TransformOptions = z.object({
  url: z.string(),
  blur: z.coerce.number().min(0).max(250).optional(),

  format: Format.optional(),

  height: z.coerce.number().min(0).optional(),
  h: z.coerce.number().min(0).optional(),

  width: z.coerce.number().min(0).optional(),
  w: z.coerce.number().min(0).optional(),

  quality: z.coerce.number().min(0).max(100).optional(),
  q: z.coerce.number().min(0).max(100).optional(),
});

/**
 * Next.jsのremotePatternsに基づいてURLを検証する
 */
function isAllowedImageUrl(url: string, origin: string): boolean {
  try {
    const parsedUrl = new URL(url, origin);

    // 内部URLは常に許可
    if (parsedUrl.origin === origin) {
      return true;
    }

    // remotePatternに一致するかチェック
    return (nextImageConfig?.remotePatterns ?? []).some((pattern) => {
      // hostnameチェック（必須）
      if (pattern.hostname !== parsedUrl.hostname) {
        return false;
      }

      // protocolチェック（オプション）
      if (pattern.protocol && pattern.protocol !== parsedUrl.protocol.slice(0, -1)) {
        return false;
      }

      // portチェック（オプション）
      if (pattern.port !== undefined && pattern.port.toString() !== parsedUrl.port) {
        return false;
      }

      // pathnameチェック（オプション、glob patternサポート）
      if (pattern.pathname !== undefined) {
        const pathRegex = new RegExp(
          pattern.pathname.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, "."),
        );
        if (!pathRegex.test(parsedUrl.pathname)) {
          return false;
        }
      }

      return true;
    });
  } catch {
    return false;
  }
}

app.get(
  "/_next/image",
  cache({
    cacheName: "opennextjs-cloudflare-images",
    cacheControl: "public, max-age=3600, must-revalidate",
    vary: ["Accept", "Accept-Encoding"],
  }),
  zValidator("query", TransformOptions),
  async (c) => {
    const query = c.req.valid("query");
    const accept = c.req.header("accept") ?? "";
    const origin = new URL(c.req.url).origin;
    const url = new URL(query.url, c.req.url).toString();

    // remotePatterns による URL 検証
    if (!isAllowedImageUrl(url, origin)) {
      return c.json({ error: "Image URL is not allowed by remote patterns" }, 400);
    }

    const res = await (url.startsWith(origin) ? c.env.ASSETS.fetch(url) : fetch(url));
    const body = res.body;
    if (!body) return c.json(null, 404);

    const transform = await c.env.IMAGES.input(body)
      .transform({
        ...query,

        get width() {
          return query.width ?? query.w;
        },
        get height() {
          return query.height ?? query.h;
        },
      })
      .output({
        get quality() {
          return query.quality ?? query.q;
        },
        get format() {
          if (query.format !== undefined) {
            return `image/${query.format}` as const;
          }

          if (/image\/avif/.test(accept)) {
            return "image/avif" as const;
          } else if (/image\/webp/.test(accept)) {
            return "image/webp" as const;
          }

          return "image/jpeg" as const;
        },
      });

    return transform.response();
  },
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.mount("/", handler.fetch as any);

export default {
  ...app,
} satisfies ExportedHandler<Env>;

// @ts-ignore
export { DOQueueHandler } from "./.open-next/worker.js";
