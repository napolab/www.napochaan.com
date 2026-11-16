// 200 response for the public, read-only discovery documents. Browser-based agents and
// registries fetch them cross-origin, so CORS is open; the bodies hold no secrets.
export const discoveryJSONResponse = (body: unknown, contentType = 'application/json'): Response =>
  new Response(JSON.stringify(body), { headers: { 'content-type': contentType, 'access-control-allow-origin': '*' } });
