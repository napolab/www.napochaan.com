import { Suspense } from 'react';

import * as s from './styles.css';

import { ContactFormLoader } from './_components/contact-form-loader';
import { profile } from '../about/profile';

import { ContactList } from '@components/contact-list';
import { DecodingSkeleton } from '@components/decoding-skeleton';
import { SectionHeading } from '@components/section-heading';
import { resolveSectionMetadata } from '@utils/seo/resolve-section-metadata';

import type { Metadata } from 'next';

const contactDescription = 'お問い合わせ — フォーム、または各種 SNS から直接どうぞ。';

// Use the shared section helper (like about/works/news/blog/log) so contact gets a
// complete card — including the og:image (og-default.png) its hand-rolled metadata
// was missing.
export const generateMetadata = (): Metadata => resolveSectionMetadata({ docTitle: 'contact', description: contactDescription, path: '/contact' });

// ContactFormLoader reads TURNSTILE_SITE_KEY from the Cloudflare env. A static
// prerender resolves that env on the BUILD machine — where CI seeds .dev.vars from
// .dev.vars.example — so `dev-placeholder` gets frozen into the cached HTML, and the
// page has neither a time-based revalidate nor a bust-isr-cache entry to heal it.
// The page holds no CMS data, so rendering per request costs little.
export const dynamic = 'force-dynamic';

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
