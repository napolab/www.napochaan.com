import { Video } from '@components/video';

import { populatedMediaURLOf, populatedVideoOf } from './narrow-video';
import { resolvePosterSrc } from './resolve-poster-src';
import { resolveVideoSrc } from './resolve-video-src';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

// Same runtime-env pattern used across the app's RSC routes (sitemap, robots,
// llms.txt, absoluteUrl, …): read `process.env` per-render rather than baking
// values in at build time, since OpenNext surfaces the Cloudflare `vars` there.
const resolveBaseURL = (): string => process.env.BASE_URL ?? 'http://localhost:3000';
const resolveTransformsEnabled = (): boolean => process.env.MEDIA_TRANSFORMS === '1';

/**
 * Renders the `video` lexical block (see `src/blocks/video`) using the
 * project's `Video` primitive. Skips rendering when the block's own `video`
 * field is not a populated media doc (numeric id / missing) — mirrors the
 * image-row converter's policy.
 *
 * `ambient`: a silent looping clip, downsized/audio-stripped via Media
 * Transformations when eligible (`resolveVideoSrc`).
 * `player`: the raw source file with controls.
 *
 * Both variants resolve a poster: an explicit editor-supplied poster wins,
 * else an auto-generated `mode=frame` still when the source fits the
 * transform's input envelope, else none (`resolvePosterSrc`). The block's own
 * `poster` field is only ever populated for `player` (see
 * `src/blocks/video/index.ts`'s admin `condition`), so for `ambient` this is
 * effectively always the auto-generated-frame path; `Video` uses it both to
 * paint the `poster` attribute and, for `ambient`, as the
 * prefers-reduced-motion fallback image.
 */
export const videoBlockConverters: NonNullable<JSXConverters<NodeTypes>['blocks']> = {
  video: ({ node }) => {
    const { fields } = node;
    const video = populatedVideoOf(fields.video);
    if (video === undefined) return null;

    const baseURL = resolveBaseURL();
    const enabled = resolveTransformsEnabled();
    const meta = { duration: video.duration, filesize: video.filesize };

    const src = resolveVideoSrc({ variant: fields.variant, url: video.url, baseURL, enabled, meta });
    const posterSrc = resolvePosterSrc({
      explicitPosterURL: populatedMediaURLOf(fields.poster),
      videoURL: video.url,
      baseURL,
      enabled,
      meta,
    });

    return <Video src={src} variant={fields.variant} width={video.width} height={video.height} caption={fields.caption} posterSrc={posterSrc} />;
  },
};
