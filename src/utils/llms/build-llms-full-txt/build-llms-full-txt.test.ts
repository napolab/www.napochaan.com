import { describe, expect, it } from 'vitest';

import { buildLLMsFullTxt } from './index';

import type { Profile } from '../../../app/(site)/about/_lib/profile';
import type { Post } from '../../../app/(site)/blog/_lib/post';
import type { NewsItem } from '../../../app/(site)/news/_lib/news-item';
import type { WorkRow } from '../../../app/(site)/works/_lib/work-row';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const baseUrl = 'https://www.napochaan.com';

const bodyOf = (text: string): SerializedEditorState =>
  ({
    root: {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', text }] }],
    },
  }) as unknown as SerializedEditorState;

const news: readonly NewsItem[] = [{ id: 'n1', slug: 'news-headline', date: '2026-06-01', category: 'release', title: 'News Headline', body: bodyOf('news body text') }];
const blog: readonly Post[] = [
  {
    id: 'b1',
    slug: 'blog-headline',
    index: '01',
    title: 'Blog Headline',
    readMin: 3,
    date: '2026-05-01',
    excerpt: 'an excerpt',
    body: bodyOf('blog body text'),
  },
];
const works: readonly WorkRow[] = [{ id: 'w1', slug: 'work-headline', no: '01', title: 'Work Headline', type: 'DJ', year: 2026 }];
const profile: Profile = {
  name: 'napochaan',
  aka: 'naporitan',
  now: 'engineer',
  team: 'Booth2Booth',
  tagline: 'a one-line tagline',
  bio: bodyOf('this is the bio text'),
  philosophy: bodyOf('this is the philosophy text'),
  love: [],
  skillGroups: [],
  contacts: [],
};

describe('buildLLMsFullTxt', () => {
  it('starts with the napochaan H1', () => {
    const text = buildLLMsFullTxt({ baseUrl, news, blog, works, profile });
    const [firstLine] = text.split('\n');
    expect(firstLine).toBe('# napochaan');
  });

  it('includes the profile bio and philosophy text', () => {
    const text = buildLLMsFullTxt({ baseUrl, news, blog, works, profile });
    expect(text).toContain('this is the bio text');
    expect(text).toContain('this is the philosophy text');
  });

  it('includes plain-text body for news and blog entries', () => {
    const text = buildLLMsFullTxt({ baseUrl, news, blog, works, profile });
    expect(text).toContain('news body text');
    expect(text).toContain('blog body text');
  });

  it('includes absolute urls, titles, and dates for entries', () => {
    const text = buildLLMsFullTxt({ baseUrl, news, blog, works, profile });
    expect(text).toContain('News Headline');
    expect(text).toContain(`${baseUrl}/news/n1`);
    expect(text).toContain('2026-06-01');
    expect(text).toContain(`${baseUrl}/blog/b1`);
  });

  it('includes works title, type, and year', () => {
    const text = buildLLMsFullTxt({ baseUrl, news, blog, works, profile });
    expect(text).toContain('Work Headline');
    expect(text).toContain('DJ');
    expect(text).toContain('2026');
    expect(text).toContain(`${baseUrl}/works/w1`);
  });

  it('renders without a profile', () => {
    const text = buildLLMsFullTxt({ baseUrl, news, blog, works, profile: undefined });
    expect(text).toContain('# napochaan');
    expect(text).toContain('News Headline');
  });
});
