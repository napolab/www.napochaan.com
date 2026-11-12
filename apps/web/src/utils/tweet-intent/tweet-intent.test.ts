import { describe, expect, it } from 'vitest';

import { buildTweetUrl } from './index';

describe('buildTweetUrl', () => {
  it('builds an X intent URL with encoded title and url', () => {
    const result = buildTweetUrl('作品 & タイトル', 'https://www.napochaan.com/works/1');
    expect(result).toBe('https://twitter.com/intent/tweet?text=%E4%BD%9C%E5%93%81%20%26%20%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB&url=https%3A%2F%2Fwww.napochaan.com%2Fworks%2F1');
  });
});
