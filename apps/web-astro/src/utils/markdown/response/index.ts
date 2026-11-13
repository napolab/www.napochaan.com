/** 200 response for the `.md` endpoints. */
export const markdownResponse = (text: string): Response => new Response(text, { headers: { 'content-type': 'text/markdown; charset=utf-8' } });

/** 404 for `.md` detail endpoints whose slug matches no published record. */
export const notFoundResponse = (): Response => new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
