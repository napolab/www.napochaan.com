// The parsed bodies of every `<script type="application/ld+json">` in a rendered page.
export const jsonLDOf = (html: string): unknown[] => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1] ?? ''));
