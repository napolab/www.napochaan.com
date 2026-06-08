import * as s from './styles.css';

import { PageHeader } from '@components/page-header';

import type { Metadata } from 'next';

export const revalidate = 3600;

const crumbs = [{ href: '/', label: 'home' }, { label: 'contact' }];

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return 'contact';
    },
    get description() {
      return 'お問い合わせ — 連絡先・依頼の窓口。';
    },
  };
};

const ContactPage = () => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="contact" breadcrumbs={crumbs} kicker="// お問い合わせ" lead="準備中です。" />
    </main>
  );
};

export default ContactPage;
