# MCP Tools: Read-Normalize, Write-Strict

Policy for the MCP blog tools (`src/lib/mcp`), established in PR #21 (media URL normalization) and reaffirmed in PR #27 (code fence language keys).

## The Rule

- **Read paths** (`get_post`, markdown export) may normalize representations to a canonical form (e.g. media URLs → `![media:<id>]` placeholders).
- **Write paths** (`create_post` / `update_post` validation) must be strict: invalid or unsupported input is **rejected with an actionable recovery hint** — never silently converted, coerced, or dropped.

## What a Recovery Hint Contains

The error message is written for an LLM caller and must let it self-correct in one retry:

1. What is wrong, in one sentence.
2. The full list of valid options (e.g. 対応キー: `typescript / tsx / css / json / bash`).
3. The offending line/fragment quoted verbatim (該当行: ...).
4. The escape hatch, if one exists (キー省略も可 / admin から編集してください).

## Why Not Silent Conversion

Silent coercion (e.g. mapping an unknown fence language to plain text) loses information without telling the caller, and a later read-modify-write cycle bakes the loss in permanently. An explicit reject keeps the document unchanged and pushes the decision back to the caller. This was an explicit design decision (サイレント変換却下, PR #21) — do not "helpfully" soften a write-path validation into a conversion.

## Where Validation Lives

Per-block validation goes in that block's `mcp-support/` plugin (`McpBlockSupport.validateFences`), registered in `src/lib/mcp/markdown`. Convert upstream errors that would surface as opaque Payload `ValidationError`s (e.g. select-field option mismatches) into recovery hints **before** they reach Payload.
