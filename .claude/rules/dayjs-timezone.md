---
description: Always use dayjs from @utils/dayjs with .tz("Asia/Tokyo") — no raw Date
paths:
  - "src/**/*.{ts,tsx}"
---

Always use `dayjs` for date/time operations. Never use raw `Date` or other date libraries.

Import from the project helper — never import `dayjs` directly:

```ts
// Good
import { dayjs } from "@utils/dayjs";

// Bad
import dayjs from "dayjs";
```

Always call `.tz("Asia/Tokyo")` when creating or formatting dates:

```ts
// Good
dayjs().tz("Asia/Tokyo");
dayjs(someDate).tz("Asia/Tokyo").format("YYYY-MM-DD");

// Bad — missing timezone, defaults to local/UTC
dayjs();
dayjs(someDate).format("YYYY-MM-DD");
new Date();
```
