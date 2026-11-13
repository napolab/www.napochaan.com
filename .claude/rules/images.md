---
paths:
  - "apps/web/src/**/*.{ts,tsx,astro}"
  - "apps/web/worker/**/*.ts"
---

# Images: use `@components/image`, not a raw `<img>` or `astro:assets`

Never render a bare `<img>` for content images and never use Astro's `astro:assets` `<Image />` / `<Picture />`. Always render images through the `Image` component exported from `@components/image` (usable from `.astro` and from React islands). When you want a blur placeholder, build the `blurDataURL` with `formatBlurURL` from `@components/image/helper`.

## Required Pattern

```tsx
import { Image } from '@components/image';
import { formatBlurURL } from '@components/image/helper';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  placeholder="blur"
  blurDataURL={formatBlurURL('/hero.jpg', { blur: 20 })}
/>;
```

## Avoid Pattern

```tsx
// Wrong - astro:assets optimizes through Astro's own /_image endpoint, bypassing the
// worker's Cloudflare Images transformer; a raw <img> gets no srcset or blur placeholder.
import { Image } from 'astro:assets';

<Image src="/hero.jpg" alt="Hero" width={1920} height={1080} />;
<img src="/hero.jpg" alt="Hero" />;
```

## Why

Image optimization runs on the Cloudflare Images binding, not in the build: the worker serves `/_next/image` (`apps/web/worker/handlers/images/`; the path is kept from the Next.js era so URLs already in caches and feeds stay valid) and routes it through `c.env.IMAGES` for format conversion, resizing, and blur. The `Image` component in `@components/image` is a plain `<img>` with a responsive `srcset` pointing at that endpoint (`sources.ts`) plus the blur placeholder. Hydrated, it clears the placeholder on load; server-only (no `client:*`), the inline `imageBlurScriptHtml` script in the site layout clears it.

## Paired Files

`apps/web/src/components/image/` and `apps/web/worker/handlers/images/` are a pair. When you change query shape, allowed origins, or the transformer behavior, update both sides. Each directory has its own `CLAUDE.md` explaining its half.

## Media source: cms over RPC

Media files are stored in the cms (R2). apps/web has no R2/D1: the transformer's origin fetcher (`payload-media-fetcher`) and the `/api/media/file/[filename]` route read the original through the `env.CMS` Service Binding (`hc<CMSAppType>` RPC, `getRequestContext()` env), never by fetching the cms hostname over HTTP. Allowed origins therefore stay same-origin `/api/media/file/*` paths on web; the cms host is not an image origin.
