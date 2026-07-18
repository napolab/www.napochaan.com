// YouTube URL から 11 桁の videoID を抽出する。対応形式:
//   - https://www.youtube.com/watch?v=<ID>
//   - https://youtu.be/<ID>
//   - https://www.youtube.com/embed/<ID>
//   - https://www.youtube.com/shorts/<ID>
//   - https://m.youtube.com/watch?v=<ID>
// スキームは https のみ許可(埋め込み iframe が https 前提)。
// videoID は英数字 + '-' + '_' の 11 文字(YouTube の内部ID仕様)。

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const ALLOWED_HOSTS: readonly string[] = ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com'];

const isVideoID = (value: string | null | undefined): value is string => typeof value === 'string' && VIDEO_ID.test(value);

// URL.pathname は先頭 '/'。'/embed/<id>' や '/shorts/<id>' から <id> を取り出す。
const idFromPathPrefix = (pathname: string, prefix: string): string | undefined => {
  if (!pathname.startsWith(prefix)) return undefined;
  const rest = pathname.slice(prefix.length);
  const [id] = rest.split('/');

  return isVideoID(id) ? id : undefined;
};

const parseHosted = (url: URL): string | undefined => {
  const path = url.pathname;
  if (path === '/watch') {
    const v = url.searchParams.get('v');

    return isVideoID(v) ? v : undefined;
  }

  return idFromPathPrefix(path, '/embed/') ?? idFromPathPrefix(path, '/shorts/') ?? idFromPathPrefix(path, '/v/');
};

// youtu.be/<id> は host 側で判定するため path 先頭 '/' の直後を videoID とみなす。
const parseShortLink = (url: URL): string | undefined => {
  const id = url.pathname.slice(1).split('/')[0];

  return isVideoID(id) ? id : undefined;
};

export const parseYouTubeVideoID = (raw: string): string | undefined => {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') return undefined;
    if (!ALLOWED_HOSTS.includes(url.hostname)) return undefined;
    if (url.hostname === 'youtu.be') return parseShortLink(url);

    return parseHosted(url);
  } catch {
    return undefined;
  }
};
