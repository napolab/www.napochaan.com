import { escapeXml } from '../escape-xml';
import { toRfc822 } from '../rfc822-date';

import type { ChannelData, ItemData } from '../types';

export type CreateRssDocumentInput = {
  channel: ChannelData;
  items: readonly ItemData[];
};

// Builds the lines unique to a single `<item>`. Optional fields are emitted only
// when present; every dynamic value is escaped. `link` is the caller's
// responsibility to pre-absolutize.
const buildItem = (item: ItemData): string => {
  const guidLine = item.guid === undefined ? undefined : `      <guid isPermaLink="false">${escapeXml(item.guid)}</guid>`;
  const pubDateLine = item.pubDate === undefined ? undefined : `      <pubDate>${toRfc822(item.pubDate)}</pubDate>`;
  const categoryLine = item.category === undefined ? undefined : `      <category>${escapeXml(item.category)}</category>`;
  const descriptionLine = item.description === undefined ? undefined : `      <description>${escapeXml(item.description)}</description>`;
  const enclosureLine =
    item.enclosure === undefined ? undefined : `      <enclosure url="${escapeXml(item.enclosure.url)}" length="${item.enclosure.length}" type="${escapeXml(item.enclosure.type)}"/>`;

  const lines = [`      <title>${escapeXml(item.title)}</title>`, `      <link>${escapeXml(item.link)}</link>`, guidLine, pubDateLine, categoryLine, descriptionLine, enclosureLine].filter(
    (line): line is string => line !== undefined,
  );

  return ['    <item>', ...lines, '    </item>'].join('\n');
};

// Channel header lines: required title/link/description, then optional language,
// atom self link, and lastBuildDate (RFC-822 from ISO).
const buildChannelHead = (channel: ChannelData): string[] => {
  const languageLine = channel.language === undefined ? undefined : `    <language>${escapeXml(channel.language)}</language>`;
  const selfLine = channel.selfUrl === undefined ? undefined : `    <atom:link href="${escapeXml(channel.selfUrl)}" rel="self" type="application/rss+xml"/>`;
  const lastBuildLine = channel.lastBuildDate === undefined ? undefined : `    <lastBuildDate>${toRfc822(channel.lastBuildDate)}</lastBuildDate>`;

  return [
    `    <title>${escapeXml(channel.title)}</title>`,
    `    <link>${escapeXml(channel.link)}</link>`,
    `    <description>${escapeXml(channel.description)}</description>`,
    languageLine,
    selfLine,
    lastBuildLine,
  ].filter((line): line is string => line !== undefined);
};

// Generates a complete RSS 2.0 document. Output: XML declaration, namespaced rss
// root, channel header, then `<item>`s. Empty `items` still yields a valid channel.
export const createRssDocument = ({ channel, items }: CreateRssDocumentInput): string => {
  const channelLines = buildChannelHead(channel);
  const itemLines = items.map(buildItem);

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">', '  <channel>', ...channelLines, ...itemLines, '  </channel>', '</rss>', ''].join(
    '\n',
  );
};
