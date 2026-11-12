import { when } from '../../../../lib/first-match-runner';
import { hasSuffix } from '../../../../lib/path-predicate';
import { anyOf, equals, isIn } from '../../../../lib/predicate';
import { TEXT_FEED_POLICY } from '../../policies';

import type { CacheControlPlugin } from '../../types';

export const isRSSFeed = hasSuffix('/rss.xml');

export const isLLMsText = isIn(['/llms.txt', '/llms-full.txt']);

export const isMarkdown = hasSuffix('.md');

export const isSecurityTxt = equals('/.well-known/security.txt');

export const textFeedPlugin: CacheControlPlugin = when(anyOf(isRSSFeed, isLLMsText, isMarkdown, isSecurityTxt), () => TEXT_FEED_POLICY);
