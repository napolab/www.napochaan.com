import { describe, expect, it } from 'vitest';

import { createMissingMediaFileHintPlugin, createRawRefHint, createRawRefHintPlugins, createResolvedMediaFileHintPlugin, externalHintPlugin } from '.';

import type { MediaHit } from '.';
import type { ImageNode } from '../../markdown/image-ref';

const mediaFileNode = (raw: string, filename: string): ImageNode => ({ kind: 'image', raw, ref: { kind: 'mediaFile', filename, alt: 'x' } });
const externalNode = (raw: string, target: string): ImageNode => ({ kind: 'image', raw, ref: { kind: 'external', target, alt: 'x' } });

describe('createResolvedMediaFileHintPlugin', () => {
  it('matches a mediaFile ref that has a hit', () => {
    const node = mediaFileNode('![a](/api/media/file/known.jpeg)', 'known.jpeg');
    const hitByFilename: ReadonlyMap<string, MediaHit> = new Map([['known.jpeg', { id: 42, alt: '既存のalt' }]]);
    const result = createResolvedMediaFileHintPlugin(hitByFilename).run(node);
    expect(result._unsafeUnwrap()).toBe('- ![a](/api/media/file/known.jpeg): media id=42 の画像です。![media:42](既存のalt) に置き換えて再送してください。');
  });

  it('errs when the ref is not mediaFile', () => {
    const node = externalNode('![c](https://example.com/ext.png)', 'https://example.com/ext.png');
    const result = createResolvedMediaFileHintPlugin(new Map()).run(node);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(node);
  });

  it('errs when the mediaFile ref has no hit', () => {
    const node = mediaFileNode('![b](/api/media/file/unknown.png)', 'unknown.png');
    expect(createResolvedMediaFileHintPlugin(new Map()).run(node).isErr()).toBe(true);
  });
});

describe('createMissingMediaFileHintPlugin', () => {
  it('matches a mediaFile ref that has no hit', () => {
    const node = mediaFileNode('![b](/api/media/file/unknown.png)', 'unknown.png');
    const result = createMissingMediaFileHintPlugin(new Map()).run(node);
    expect(result._unsafeUnwrap()).toBe(
      '- ![b](/api/media/file/unknown.png): 対応する media(unknown.png)が見つかりません。upload_media で登録し、返された placeholder(![media:<id>](alt))をそのまま貼ってください。',
    );
  });

  it('errs when the ref is not mediaFile', () => {
    const node = externalNode('![c](https://example.com/ext.png)', 'https://example.com/ext.png');
    expect(createMissingMediaFileHintPlugin(new Map()).run(node).isErr()).toBe(true);
  });

  it('errs when the mediaFile ref already has a hit', () => {
    const node = mediaFileNode('![a](/api/media/file/known.jpeg)', 'known.jpeg');
    const hitByFilename: ReadonlyMap<string, MediaHit> = new Map([['known.jpeg', { id: 42, alt: 'x' }]]);
    expect(createMissingMediaFileHintPlugin(hitByFilename).run(node).isErr()).toBe(true);
  });
});

describe('externalHintPlugin', () => {
  it('always matches (terminal plugin, no state required)', () => {
    const node = externalNode('![c](https://example.com/ext.png)', 'https://example.com/ext.png');
    const result = externalHintPlugin.run(node);
    expect(result._unsafeUnwrap()).toBe('- ![c](https://example.com/ext.png): 外部 URL は使えません。upload_media で画像を登録し、返された placeholder(![media:<id>](alt))をそのまま貼ってください。');
  });
});

describe('createRawRefHint / registry order', () => {
  it('picks the resolved variant over the missing variant when a hit exists', () => {
    const node = mediaFileNode('![a](/api/media/file/known.jpeg)', 'known.jpeg');
    const hitByFilename: ReadonlyMap<string, MediaHit> = new Map([['known.jpeg', { id: 42, alt: '既存のalt' }]]);
    expect(createRawRefHint(hitByFilename)(node)).toBe('- ![a](/api/media/file/known.jpeg): media id=42 の画像です。![media:42](既存のalt) に置き換えて再送してください。');
  });

  it('falls back to the missing variant when there is no hit', () => {
    const message = createRawRefHint(new Map())(mediaFileNode('![b](/api/media/file/unknown.png)', 'unknown.png'));
    expect(message).toBe('- ![b](/api/media/file/unknown.png): 対応する media(unknown.png)が見つかりません。upload_media で登録し、返された placeholder(![media:<id>](alt))をそのまま貼ってください。');
  });

  it('falls back to the external variant for non-mediaFile refs', () => {
    const message = createRawRefHint(new Map())(externalNode('![c](https://example.com/ext.png)', 'https://example.com/ext.png'));
    expect(message).toBe('- ![c](https://example.com/ext.png): 外部 URL は使えません。upload_media で画像を登録し、返された placeholder(![media:<id>](alt))をそのまま貼ってください。');
  });

  it('registers plugins most-specific first (resolved -> missing -> external terminal)', () => {
    const hitByFilename: ReadonlyMap<string, MediaHit> = new Map([['known.jpeg', { id: 42, alt: 'x' }]]);
    const plugins = createRawRefHintPlugins(hitByFilename);
    expect(plugins).toHaveLength(3);
    expect(plugins[2]).toBe(externalHintPlugin);
    // resolved(known.jpeg) matches at the first plugin, before missing/external get a chance.
    expect(plugins[0]?.run(mediaFileNode('![a](/api/media/file/known.jpeg)', 'known.jpeg')).isOk()).toBe(true);
    expect(plugins[1]?.run(mediaFileNode('![a](/api/media/file/known.jpeg)', 'known.jpeg')).isOk()).toBe(false);
  });

  it('two independently created hitByFilename maps produce independent plugins (state is per-instance, not shared)', () => {
    const hintA = createRawRefHint(new Map([['known.jpeg', { id: 1, alt: 'A' }]]));
    const hintB = createRawRefHint(new Map([['known.jpeg', { id: 2, alt: 'B' }]]));
    const node = mediaFileNode('![a](/api/media/file/known.jpeg)', 'known.jpeg');

    expect(hintA(node)).toBe('- ![a](/api/media/file/known.jpeg): media id=1 の画像です。![media:1](A) に置き換えて再送してください。');
    expect(hintB(node)).toBe('- ![a](/api/media/file/known.jpeg): media id=2 の画像です。![media:2](B) に置き換えて再送してください。');
  });
});
