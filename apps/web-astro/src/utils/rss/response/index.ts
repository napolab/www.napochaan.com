/** 200 response for the RSS feed endpoints (`/<section>/rss.xml`). */
export const rssResponse = (xml: string): Response => new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
