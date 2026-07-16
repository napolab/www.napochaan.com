import { getCloudflareContext } from '@opennextjs/cloudflare';

import { getOAuthHelpers } from '@lib/mcp/oauth';
import { absoluteUrl } from '@utils/site-url';

import { AuthorizeForm } from './_components/authorize-form';
import * as s from './styles.css';

import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'authorize',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const toQueryString = (params: Record<string, string | string[] | undefined>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') search.set(key, value);
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    }
  }

  return search.toString();
};

const resolveClientName = async (helpers: OAuthHelpers, query: string): Promise<string> => {
  try {
    const authRequest = await helpers.parseAuthRequest(new Request(absoluteUrl(`/oauth/authorize?${query}`)));
    const client = await helpers.lookupClient(authRequest.clientId);

    return client?.clientName ?? '不明なクライアント';
  } catch {
    return '不明なクライアント';
  }
};

const AuthorizePage = async ({ searchParams }: Props) => {
  const query = toQueryString(await searchParams);
  const { env } = await getCloudflareContext({ async: true });
  const helpers = getOAuthHelpers(env);
  const clientName = helpers !== undefined ? await resolveClientName(helpers, query) : '不明なクライアント';

  return (
    // Page h1 lives in layout.tsx's PageHeader — this section owns its own h2
    // (semantic-html: every section needs a heading of its own).
    <section className={s.root}>
      <h2 className={s.heading}>アクセス許可の確認</h2>
      <AuthorizeForm authRequestQuery={query} clientName={clientName} />
    </section>
  );
};

export default AuthorizePage;
