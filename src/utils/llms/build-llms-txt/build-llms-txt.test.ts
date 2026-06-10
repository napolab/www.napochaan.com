import { describe, expect, it } from 'vitest';

import { buildLLMsTxt } from './index';

import type { Profile } from '../../../app/(site)/about/_lib/profile';
import type { Post } from '../../../app/(site)/blog/_lib/post';
import type { NewsItem } from '../../../app/(site)/news/_lib/news-item';
import type { WorkRow } from '../../../app/(site)/works/_lib/work-row';

const baseUrl = 'https://www.napochaan.com';

const news: readonly NewsItem[] = [{ id: 'n1', date: '2026-06-01', category: 'release', title: 'News Headline' }];
const blog: readonly Post[] = [{ id: 'b1', index: '01', title: 'Blog Headline', readMin: 3, date: '2026-05-01', excerpt: 'an excerpt' }];
const works: readonly WorkRow[] = [{ id: 'w1', no: '01', title: 'Work Headline', type: 'DJ', year: 2026, date: '2026-04-01' }];
const profile: Profile = {
  name: 'napochaan',
  aka: 'naporitan',
  now: 'engineer',
  team: 'Booth2Booth',
  tagline: 'a one-line tagline',
  love: [],
  skillGroups: [],
  contacts: [],
};

describe('buildLLMsTxt', () => {
  it('starts with the napochaan H1 and a blockquote summary', () => {
    const text = buildLLMsTxt({ baseUrl, news, blog, works, profile });
    const [firstLine] = text.split('\n');
    expect(firstLine).toBe('# napochaan');
    expect(text).toContain('> a one-line tagline');
  });

  it('falls back to a sensible summary without a profile', () => {
    const text = buildLLMsTxt({ baseUrl, news, blog, works, profile: undefined });
    expect(text).toContain('# napochaan');
    expect(text).toMatch(/^> .+/m);
  });

  it('includes section headers', () => {
    const text = buildLLMsTxt({ baseUrl, news, blog, works, profile });
    expect(text).toContain('## About');
    expect(text).toContain('## Works');
    expect(text).toContain('## News');
    expect(text).toContain('## Blog');
    expect(text).toContain('## Feeds');
  });

  it('renders absolute markdown bullet links for each entry', () => {
    const text = buildLLMsTxt({ baseUrl, news, blog, works, profile });
    expect(text).toContain(`- [News Headline](${baseUrl}/news/n1)`);
    expect(text).toContain(`- [Blog Headline](${baseUrl}/blog/b1)`);
    expect(text).toContain(`- [Work Headline](${baseUrl}/works/w1)`);
  });

  it('links the three rss feeds in the Feeds section', () => {
    const text = buildLLMsTxt({ baseUrl, news, blog, works, profile });
    expect(text).toContain(`${baseUrl}/news/rss.xml`);
    expect(text).toContain(`${baseUrl}/blog/rss.xml`);
    expect(text).toContain(`${baseUrl}/works/rss.xml`);
  });
});
