type ZennRSSItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  enclosure?: {
    "@_url": string;
    "@_length": string;
    "@_type": `image/${string}`;
  };
};

export type ZennRSS = {
  rss: {
    channel: {
      item: ZennRSSItem[];
    };
  };
};

type SizuRSSItem = {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
  enclosure?: {
    "@_url": string;
    "@_length": string;
    "@_type": `image/${string}`;
  };
};

export type SizuRSS = {
  rss: {
    channel: {
      item: SizuRSSItem[];
    };
  };
};
