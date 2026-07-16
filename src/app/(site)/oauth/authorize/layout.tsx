import * as s from './styles.css';

import { PageHeader } from '@components/page-header';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'authorize' }];

// Mirrors the contact page's layout pattern: the page-level h1 lives here in
// PageHeader, not in page.tsx — keeps exactly one h1 per page (semantic-html).
const OAuthAuthorizeLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="authorize" breadcrumbs={crumbs} kicker="// OAuth" lead="MCP クライアントへのアクセスを許可するには、ログインしてください。" />
      {children}
    </main>
  );
};

export default OAuthAuthorizeLayout;
