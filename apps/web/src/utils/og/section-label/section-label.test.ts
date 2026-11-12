import { describe, expect, it } from 'vitest';

import { sectionLabel, type OgSection } from './index';

describe('sectionLabel', () => {
  it('maps each section slug to its uppercase label', () => {
    expect(sectionLabel('works')).toBe('WORKS');
    expect(sectionLabel('news')).toBe('NEWS');
    expect(sectionLabel('blog')).toBe('BLOG');
  });

  it('is typed to the three known sections', () => {
    const sections: OgSection[] = ['works', 'news', 'blog'];
    expect(sections.map(sectionLabel)).toEqual(['WORKS', 'NEWS', 'BLOG']);
  });
});
