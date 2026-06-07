import { Manifesto } from './_components/manifesto';
import { colophon } from './content';
import * as s from './styles.css';

import { PageHeader } from '@components/page-header';
import { ScrambleText } from '@components/scramble-text';
import { SectionHeading } from '@components/section-heading';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Static page; its content is sourced from the repo's
// own rules, not the CMS.
export const revalidate = 3600;

const crumbs = [{ href: '/', label: 'home' }, { label: 'colophon' }];

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return colophon.title;
    },
    get description() {
      return colophon.lead;
    },
  };
};

const ColophonPage = () => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title={colophon.title} breadcrumbs={crumbs} kicker={colophon.kicker} lead={colophon.lead} annotation="壊して · ほどいて · 組み直す" />

      <section className={s.cell}>
        <SectionHeading no="01" more="$ cat making.md">
          site
        </SectionHeading>
        <Manifesto items={colophon.site} />
      </section>

      <section className={s.cell}>
        <SectionHeading no="02" more="$ cat code.md">
          code
        </SectionHeading>
        <Manifesto items={colophon.code} />
      </section>

      <section className={s.cell}>
        <SectionHeading no="03" more="$ ls stack/">
          stack
        </SectionHeading>
        <dl className={s.stack}>
          {colophon.stack.map((row) => (
            <div key={row.term} className={s.stackRow}>
              <dt className={s.stackTerm}>{row.term}</dt>
              <dd className={s.stackDesc}>{row.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={s.cell}>
        <SectionHeading no="04">source</SectionHeading>
        <a className={s.source} href={colophon.source.href} target="_blank" rel="noopener noreferrer">
          <span className={s.sourceLabel}>
            <ScrambleText>{colophon.source.label}</ScrambleText>
          </span>
          <span className={s.sourceHandle}>
            <ScrambleText>{colophon.source.handle}</ScrambleText>
          </span>
          <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>
  );
};

export default ColophonPage;
