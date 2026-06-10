# Acronym Casing in Identifiers

Initialisms and acronyms — especially proper nouns like **LLM** — keep their canonical all-caps form inside JS/TS identifiers. Never title-case them into `Llm` / `Url` / `Rss`.

## Rules

- All-caps when the acronym is capitalized (PascalCase, or mid-identifier after another word):
  - `LLM` not `Llm`, `URL` not `Url`, `RSS` not `Rss`, `HTML` not `Html`, `JSON` not `Json`, `ID` not `Id`, `API` not `Api`.
  - e.g. `buildLLMsTxt`, `BuildLLMsTxtArgs`, `parseHTMLString`, `toRSSDocument`, `userID`.
- Pluralize with a trailing lowercase `s` (the `s` is not part of the acronym): `LLMs`, `URLs`, `IDs`.
- When the acronym is the **first word** of a camelCase identifier (locals, params, non-type members), lowercase the whole acronym: `llmSummary`, `htmlString`, `idList`, `urlParser`.
- **File and directory names are exempt** — they stay kebab-case, all lowercase, regardless of the acronym: `build-llms-txt/`, `news/rss.xml/`, `llms-full.txt/`. This rule governs *identifiers*, not filenames.

## Examples

```ts
// Good
export const buildLLMsTxt = (args: BuildLLMsTxtArgs): string => { ... };
type BuildLLMsTxtArgs = { baseUrl: string };
const llmSummary = resolveSummary(profile);

// Bad — proper-noun acronym title-cased
export const buildLlmsTxt = (args: BuildLlmsTxtArgs): string => { ... };
```

## Why

`LLM`, `URL`, `RSS`, `ID` are read as single units. Title-casing them (`Llm`, `Url`) makes the identifier read as an ordinary word and obscures that it's an acronym — it looks wrong at a glance and breaks symmetry with the all-caps forms already in the codebase (`formatBlurURL`, `serverURL`).

## Note

Some older identifiers (e.g. `baseUrl`, `typekitLoaderHtml`) predate this rule. Don't mass-rename them in unrelated changes — but write new identifiers in the canonical form, and match it when you touch a cluster.
