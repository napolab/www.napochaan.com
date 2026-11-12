---
paths:
  - "apps/web/src/**/*.{ts,tsx}"
  - "apps/web/worker/**/*.ts"
---

# Images: use `@components/image`, not `next/image`

Never import `next/image` directly. Always render images through the `Image` component exported from `@components/image`. When you want a blur placeholder, build the `blurDataURL` with `formatBlurURL` from `@components/image/helper`.

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
// Wrong - bypasses the Cloudflare Images transformer and fails at runtime.
import Image from 'next/image';

<Image src="/hero.jpg" alt="Hero" width={1920} height={1080} />;
```

## Why

Next.js's default image optimizer depends on `sharp` (a Node native module) and does not run on Cloudflare Workers. The project intercepts `/_next/image` requests at the worker layer (`apps/web/worker/handlers/images/`) and routes them through the Cloudflare Images binding (`c.env.IMAGES`) for format conversion, resizing, and blur. The `Image` component in `@components/image` is a thin `NextImage` wrapper that assumes this transformer is in place and also handles the placeholder-to-final-image swap timing to avoid flicker.

## Paired Files

`apps/web/src/components/image/` and `apps/web/worker/handlers/images/` are a pair. When you change query shape, allowed origins, or the transformer behavior, update both sides. Each directory has its own `CLAUDE.md` explaining its half.

## Media source: cms over RPC

Media files are stored in the cms (R2). apps/web has no R2/D1: the transformer's origin fetcher (`payload-media-fetcher`) and the `/api/media/file/[filename]` route read the original through the `env.CMS` Service Binding (`hc<CMSAppType>` RPC, `getCloudflareContext()` env), never by fetching the cms hostname over HTTP. Allowed origins therefore stay same-origin `/api/media/file/*` paths on web; the cms host is not an image origin.
