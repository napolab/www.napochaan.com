import { err, ok } from 'neverthrow';

import { parseYouTubeVideoID } from '../parse-url';

import type { LinkEmbedProvider } from '@utils/lexical/link-embed';

// youtube-embed の link-embed provider(prefix-match-processor 形式)。
// 汎用 transform(@utils/lexical/link-embed)が抽出した StandaloneLink を受け取り、
// URL が YouTube 動画として解釈できれば ok(block fields)、できなければ err(link) を
// 返して次の provider に委ねる(素通し — 拒否ではない)。
//
// field の意味論は旧 lexical-transform と同一:
//   - url は書かれたまま格納する(正規化しない — admin 側 validate と同じ受理集合)。
//   - caption が空('')のときは key ごと省略する(旧 parseFenceBody と同じ)。
// id はここでは採番しない — 汎用層が generateID で被せる。
export const youtubeEmbedProvider = {
  run(link) {
    if (parseYouTubeVideoID(link.url) === undefined) return err(link);
    if (link.caption === '') return ok({ blockType: 'youtube-embed', url: link.url });

    return ok({ blockType: 'youtube-embed', url: link.url, caption: link.caption });
  },
} satisfies LinkEmbedProvider;
