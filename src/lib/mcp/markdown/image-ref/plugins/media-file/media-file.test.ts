import { describe, expect, it } from 'vitest';

import { createMediaFilePlugin, DEFAULT_MEDIA_FILE_PATH_PREFIX } from '.';

describe('createMediaFilePlugin (DEFAULT_MEDIA_FILE_PATH_PREFIX)', () => {
  const mediaFilePlugin = createMediaFilePlugin(DEFAULT_MEDIA_FILE_PATH_PREFIX);

  it('matches a relative /api/media/file/ ref', () => {
    const result = mediaFilePlugin.run('![](/api/media/file/IMG_0185.jpeg)');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'mediaFile', filename: 'IMG_0185.jpeg', alt: '' });
  });

  it('matches an absolute URL ref on any host', () => {
    const result = mediaFilePlugin.run('![cover](https://napochaan.com/api/media/file/cover.png)');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'mediaFile', filename: 'cover.png', alt: 'cover' });
  });

  it('decodes URL-encoded filenames', () => {
    const result = mediaFilePlugin.run('![](/api/media/file/IMG%200185.jpeg)');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'mediaFile', filename: 'IMG 0185.jpeg', alt: '' });
  });

  it('drops a markdown title before parsing the URL', () => {
    const result = mediaFilePlugin.run('![x](/api/media/file/a.jpeg "title")');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'mediaFile', filename: 'a.jpeg', alt: 'x' });
  });

  it('does not match an external image URL', () => {
    const result = mediaFilePlugin.run('![x](https://example.com/x.png)');
    expect(result.isErr()).toBe(true);
  });

  it('does not match a nested path under /api/media/file/', () => {
    const result = mediaFilePlugin.run('![](/api/media/file/sub/dir.jpeg)');
    expect(result.isErr()).toBe(true);
  });

  it('does not match malformed percent-encoding (decodeURIComponent throws)', () => {
    const result = mediaFilePlugin.run('![](/api/media/file/bad%E0%A4%A.jpeg)');
    expect(result.isErr()).toBe(true);
  });

  it('does not match empty parens', () => {
    const result = mediaFilePlugin.run('![x]()');
    expect(result.isErr()).toBe(true);
  });
});

describe('createMediaFilePlugin (injected custom prefix)', () => {
  it('matches under the injected prefix instead of the default', () => {
    const plugin = createMediaFilePlugin('/custom/assets/');
    const result = plugin.run('![](/custom/assets/a.png)');
    expect(result._unsafeUnwrap()).toEqual({ kind: 'mediaFile', filename: 'a.png', alt: '' });
  });

  it('no longer matches the default prefix once a different prefix is injected', () => {
    const plugin = createMediaFilePlugin('/custom/assets/');
    const result = plugin.run('![](/api/media/file/a.png)');
    expect(result.isErr()).toBe(true);
  });
});
