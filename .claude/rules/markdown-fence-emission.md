# Markdown Fence Emission

Rules for any code path that wraps arbitrary content in Markdown ``` fences (llms.txt exporters, MCP `get_post`, block `jsx.export` converters).

## Never Hardcode the Fence

Content being wrapped may itself contain fence lines. A hardcoded ```` ``` ```` terminates early at the first embedded fence line and corrupts everything after it. Use `fenceForCode` from `src/utils/code-fence` — it returns a fence one backtick longer than the longest leading backtick run in the content (minimum 3), per CommonMark.

```typescript
// Correct
import { fenceForCode } from '@/utils/code-fence'; // (path per caller)
const fence = fenceForCode(code);
return `${fence}${lang}\n${code}\n${fence}`;

// Forbidden — breaks when code contains a ``` line
return `\`\`\`${lang}\n${code}\n\`\`\``;
```

## Reject What Cannot Round-Trip — Never Corrupt Silently

If the matching import path cannot parse a shape the export path can produce (e.g. lexical's regex-based `customStartRegex`/`customEndRegex` cannot match fence lengths, so 4+ backtick fences close early on the inner ``` line), the write path must **reject that shape explicitly with a recovery hint** instead of importing it corrupted.

Precedent: `src/blocks/code/mcp-support` rejects 4+ backtick fences with 「admin から編集してください」 rather than silently truncating the code (PR #27 review).

## Do Not Trust Premade Converters on Edge Cases

Payload's premade/`@experimental` converters have shipped with real bugs (3.84.1 `CodeBlock` import corrupts a bare fence with single-line content into `"undefined<code>"` via a `'```' + undefined` string comparison). Before adopting one:

- Execute the vendor converter directly against edge-case inputs (empty language, single line, adjacent fences) — do not reason from its source alone.
- Pin the behavior you depend on with unit tests so a package upgrade that changes it fails loudly.
- If it is buggy, replace it via `fieldOverrides.jsx` (keep the premade admin UI) rather than patching around it downstream.
