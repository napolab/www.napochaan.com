---
paths:
  - "src/**/*.{ts,tsx}"
  - "worker/**/*.ts"
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

Next.js's default image optimizer depends on `sharp` (a Node native module) and does not run on Cloudflare Workers. The project intercepts `/_next/image` requests at the worker layer (`worker/handlers/images/`) and routes them through the Cloudflare Images binding (`c.env.IMAGES`) for format conversion, resizing, and blur. The `Image` component in `@components/image` is a thin `NextImage` wrapper that assumes this transformer is in place and also handles the placeholder-to-final-image swap timing to avoid flicker.

## Paired Files

`src/components/image/` and `worker/handlers/images/` are a pair. When you change query shape, allowed origins, or the transformer behavior, update both sides. Each directory has its own `CLAUDE.md` explaining its half.
