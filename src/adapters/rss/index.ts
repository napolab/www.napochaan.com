import { XMLParser } from "fast-xml-parser";
import { unstable_cache as cache } from "next/cache";

import type { ZennRSS } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
});
export const getZennArticles = cache(
  async () => {
    const res = await fetch("https://zenn.dev/naporin24690/feed?all=1");
    const xml = await res.text();
    const parsed: ZennRSS = parser.parse(xml);

    return parsed.rss.channel.item;
  },
  ["zenn-article"],
  {
    revalidate: 60 * 60,
    tags: ["zenn", "posts", "all"],
  },
);
