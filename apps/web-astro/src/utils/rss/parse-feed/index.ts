import { XMLParser } from 'fast-xml-parser';

import { dayjs } from '@utils/dayjs';

import type { FeedItem } from '../types';

// A leaf value coming out of fast-xml-parser is either a plain string (CDATA is
// merged into the string by default) or, when the element carries attributes, an
// object whose text content lives under `#text`. `readText` collapses both to a
// string, returning undefined for anything else.
const readText = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '#text' in value) {
    const { '#text': text } = value;
    if (typeof text === 'string') return text;
  }

  return undefined;
};

// Reads a property off an unknown record, guarding the access without `any`.
const readField = (item: unknown, key: string): unknown => {
  if (typeof item !== 'object' || item === null) return undefined;
  if (!(key in item)) return undefined;
  const record: Record<string, unknown> = { ...item };

  return record[key];
};

// Normalizes the channel's `item` (single object, array, or absent) into an array.
const toItemArray = (raw: unknown): readonly unknown[] => (Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]);

// Parses an RFC-822 pubDate into an ISO string in Asia/Tokyo, or undefined when
// missing/invalid — a chronicle entry needs a date.
const toIsoDate = (pubDate: string | undefined): string | undefined => {
  if (pubDate === undefined) return undefined;
  const at = dayjs(pubDate);
  if (!at.isValid()) return undefined;

  return at.tz('Asia/Tokyo').toISOString();
};

// Maps one raw parsed item to a FeedItem, or undefined when it lacks a usable
// title, link, or date.
const toFeedItem = (raw: unknown): FeedItem | undefined => {
  const title = readText(readField(raw, 'title'));
  const link = readText(readField(raw, 'link'));
  const date = toIsoDate(readText(readField(raw, 'pubDate')));
  if (title === undefined || link === undefined || date === undefined) return undefined;

  const guid = readText(readField(raw, 'guid'));
  const id = guid ?? link;

  return { id, title, link, date };
};

// Parses an RSS 2.0 feed string into normalized FeedItems. Resilient: malformed
// XML or an unexpected shape yields []. Items missing title/link/date are skipped.
export const parseFeed = (xml: string): readonly FeedItem[] => {
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed: unknown = parser.parse(xml);
    const channel = readField(readField(parsed, 'rss'), 'channel');
    const items = toItemArray(readField(channel, 'item'));

    return items.map(toFeedItem).filter((item): item is FeedItem => item !== undefined);
  } catch {
    return [];
  }
};
