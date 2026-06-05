Use semantic HTML elements to establish document structure and accessibility.

## Section landmarks

Every visible content region must be wrapped in a landmark element:

| Element     | Use for                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| `<main>`    | Page primary content (one per page, wraps sections)                         |
| `<section>` | Thematic grouping (concept, how-to-connect, contact ...)                    |
| `<article>` | Self-contained, independently distributable content (event card, blog post) |
| `<header>`  | Site or section header with navigation                                      |
| `<footer>`  | Site or section footer                                                      |
| `<nav>`     | Primary or secondary navigation                                             |
| `<aside>`   | Tangentially related content                                                |

Do not use `<div>` as a top-level content region. `<div>` is for layout grouping only.

## Heading hierarchy

- Every `<section>` and `<article>` must contain a heading element (`<h1>`-`<h6>`)
- The page must have exactly one `<h1>`
- Headings must not skip levels (e.g. `<h2>` followed by `<h4>`)
- If the heading is visually hidden, use `srOnly` from Panda CSS — never `display: none` or `visibility: hidden`
- Decorative or non-thematic sections (e.g. animated band) may use `aria-label` instead of a heading element

```tsx
// Good — section with heading
<section id="concept">
  <h2 className={s.srOnly}>./booth2booth --manifest</h2>
  {/* content */}
</section>

// Good — article for individual item
<article>
  <h3>{event.title}</h3>
  {/* event details */}
</article>

// Bad — div as content region
<div className={s.section}>
  {/* missing landmark and heading */}
</div>

// Bad — heading skip
<h2>Section</h2>
<h4>Subsection</h4>  {/* skipped h3 */}
```
