import * as s from './styles.css';

import { PageHeader } from '@components/page-header';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'contact' }];

const ContactLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="contact" breadcrumbs={crumbs} kicker="// お問い合わせ" lead="お仕事のご依頼・ご相談はこちらから。" />
      {children}
    </main>
  );
};

export default ContactLayout;
