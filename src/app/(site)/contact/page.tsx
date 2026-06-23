import { Suspense } from 'react';

import * as s from './styles.css';

import { ContactFormLoader } from './_components/contact-form-loader';
import { profile } from '../about/profile';

import { ContactList } from '@components/contact-list';
import { DecodingSkeleton } from '@components/decoding-skeleton';
import { SectionHeading } from '@components/section-heading';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

export const revalidate = 3600;

const contactDescription = 'お問い合わせ — フォーム、または各種 SNS から直接どうぞ。';

// Use the shared section helper (like about/works/news/blog/log) so contact gets a
// complete card — including the og:image (og-default.png) its hand-rolled metadata
// was missing.
export const generateMetadata = (): Metadata => resolveSectionMetadata({ docTitle: 'contact', description: contactDescription, path: '/contact' });

const ContactPage = () => {
  return (
    <div className={s.grid}>
      <section className={s.formCell}>
        <SectionHeading no="01" more="// メッセージ">
          message
        </SectionHeading>
        <Suspense fallback={<DecodingSkeleton rows={5} />}>
          <ContactFormLoader />
        </Suspense>
      </section>
      <aside className={s.directCell}>
        <SectionHeading no="02">direct</SectionHeading>
        <ContactList items={profile.contacts} />
      </aside>
    </div>
  );
};

export default ContactPage;
