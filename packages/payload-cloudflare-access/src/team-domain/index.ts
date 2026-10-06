import { InvalidAccessTeamDomain } from '../errors';

const TEAM_NAME_PATTERN = /^[a-z0-9-]+$/;
const ACCESS_DOMAIN_SUFFIX = '.cloudflareaccess.com';

// よくある書き方(大文字、`https://`、末尾の `/`、`.cloudflareaccess.com` 付き)を team 名に揃える。
const toTeamName = (trimmed: string): string => {
  const host = trimmed
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  return host.endsWith(ACCESS_DOMAIN_SUFFIX) ? host.slice(0, -ACCESS_DOMAIN_SUFFIX.length) : host;
};

// 未設定(undefined / 空白だけ)は undefined = plugin 無効。設定されているのに team 名にならない値は throw する。
// 黙って通すと issuer / JWKS URL が食い違い、password ログインも無効なので誰も admin に入れなくなる。
export const normalizeTeamDomain = (raw: string | undefined): string | undefined => {
  const trimmed = raw?.trim() ?? '';
  if (trimmed === '') return undefined;

  const teamName = toTeamName(trimmed);
  if (!TEAM_NAME_PATTERN.test(teamName)) throw new InvalidAccessTeamDomain(raw ?? '');

  return teamName;
};
