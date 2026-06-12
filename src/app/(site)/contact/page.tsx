import { getCloudflareContext } from '@opennextjs/cloudflare';

import * as s from './styles.css';

import { ContactForm } from './_components/contact-form';
import { profile } from '../about/profile';

import { ContactList } from '@components/contact-list';
import { PageHeader } from '@components/page-header';
import { SectionHeading } from '@components/section-heading';

import type { Metadata } from 'next';

export const revalidate = 3600;

const crumbs = [{ href: '/', label: 'home' }, { label: 'contact' }];

const contactDescription = 'お問い合わせ — フォーム、または各種 SNS から直接どうぞ。';

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return 'contact';
    },
    get description() {
      return contactDescription;
    },
    alternates: { canonical: '/contact' },
    get openGraph() {
      return { title: 'contact — napochaan', description: contactDescription };
    },
    get twitter() {
      return { title: 'contact — napochaan', description: contactDescription };
    },
  };
};

const ContactPage = async () => {
  const { env } = await getCloudflareContext({ async: true });

  return (
    <main id="main-content" className={s.main}>
      <PageHeader title="contact" breadcrumbs={crumbs} kicker="// お問い合わせ" lead="お仕事のご依頼・ご相談はこちらから。" />
      <div className={s.grid}>
        <section className={s.formCell}>
          <SectionHeading no="01" more="// メッセージ">
            message
          </SectionHeading>
          <ContactForm turnstileSiteKey={env.TURNSTILE_SITE_KEY} />
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
