import * as s from './styles.css';

import { ContactForm } from './_components/contact-form';
import { profile } from '../about/profile';

import { ContactList } from '@components/contact-list';
import { PageHeader } from '@components/page-header';
import { SectionHeading } from '@components/section-heading';

import type { Metadata } from 'next';

export const revalidate = 3600;

const crumbs = [{ href: '/', label: 'home' }, { label: 'contact' }];

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return 'contact';
    },
    get description() {
      return 'お問い合わせ — フォーム、または各種 SNS から直接どうぞ。';
    },
  };
};

const ContactPage = () => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="contact" breadcrumbs={crumbs} kicker="// お問い合わせ" lead="お仕事のご依頼・ご相談はこちらから。" />
      <div className={s.grid}>
        <section className={s.formCell}>
          <SectionHeading no="01" more="// メッセージ">
            message
          </SectionHeading>
          <ContactForm />
        </section>
        <aside className={s.directCell}>
          <SectionHeading no="02">direct</SectionHeading>
          <ContactList items={profile.contacts} />
        </aside>
      </div>
    </main>
  );
};

export default ContactPage;
