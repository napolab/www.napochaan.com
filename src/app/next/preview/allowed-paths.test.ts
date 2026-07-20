import { describe, expect, it } from 'vitest';

import { isAllowedPreviewPath } from './allowed-paths';

describe('isAllowedPreviewPath', () => {
  it('各 previewable collection の draft ルートを許可する', () => {
    expect(isAllowedPreviewPath('/news/preview/5')).toBe(true);
    expect(isAllowedPreviewPath('/works/preview/12')).toBe(true);
    expect(isAllowedPreviewPath('/blog/preview/3')).toBe(true);
    expect(isAllowedPreviewPath('/gallery/preview')).toBe(true);
    expect(isAllowedPreviewPath('/log/preview')).toBe(true);
    expect(isAllowedPreviewPath('/legal/preview/1')).toBe(true);
  });

  it('open-redirect(protocol-relative URL)を拒否する', () => {
    expect(isAllowedPreviewPath('//evil.com')).toBe(false);
    expect(isAllowedPreviewPath('https://evil.com/legal/preview/1')).toBe(false);
  });

  it('preview 接頭辞に合致しないパスを拒否する', () => {
    expect(isAllowedPreviewPath('/legal')).toBe(false);
    expect(isAllowedPreviewPath('/legal/terms')).toBe(false);
    expect(isAllowedPreviewPath('/admin')).toBe(false);
    expect(isAllowedPreviewPath(null)).toBe(false);
  });
});
