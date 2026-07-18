import { parseYouTubeVideoID } from '../../../../blocks/youtube-embed/parse-url';

import * as styles from './styles.css';

import type { JSXConverters } from '@payloadcms/richtext-lexical/react';

import type { NodeTypes } from '../types';

// youtube-nocookie.com は EU 域含めた privacy-enhanced mode。同じ videoID を受け付けるが、
// 視聴履歴/広告 cookie を書き込まない。埋め込み iframe のデフォルトはこちらにする。
const EMBED_ORIGIN = 'https://www.youtube-nocookie.com/embed';

// iframe が使ってよい機能。フルスクリーン(拡大表示)は要件で、autoplay は本文中の
// 埋め込みでは基本オフで良いが YouTube の内側 UI から動くので許可、picture-in-picture も許容。
const IFRAME_ALLOW = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';

const embedURL = (videoID: string): string => `${EMBED_ORIGIN}/${videoID}`;

/**
 * Renders the `youtube-embed` lexical block (`src/blocks/youtube-embed`,
 * blockType 'youtube-embed'). The 11-char videoID is extracted from the
 * saved URL and rendered as a 16:9 privacy-enhanced YouTube iframe with an
 * optional `<figcaption>`. If the URL cannot be parsed (unlikely because the
 * block validates on write, but data may predate a validation change), the
 * converter renders nothing rather than a broken frame.
 */
export const youtubeEmbedBlockConverters: NonNullable<JSXConverters<NodeTypes>['blocks']> = {
  'youtube-embed': ({ node }) => {
    const { url, caption } = node.fields;
    if (typeof url !== 'string') return null;
    const videoID = parseYouTubeVideoID(url);
    if (videoID === undefined) return null;

    const label = caption !== undefined && caption !== '' ? caption : 'YouTube 動画';

    return (
      <figure className={styles.root}>
        <div className={styles.frame}>
          <iframe className={styles.iframe} src={embedURL(videoID)} title={label} loading="lazy" allow={IFRAME_ALLOW} allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        </div>
        {caption !== undefined && caption !== '' ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
      </figure>
    );
  },
};
