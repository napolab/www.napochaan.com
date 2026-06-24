import { AmbientPointer } from './_components/ambient-pointer';
import { ComponentDemo } from './_components/component-demo';
import { Manifesto } from './_components/manifesto';
import { colophon } from './content';
import { demos } from './_demos';
import * as s from './styles.css';

import { ScrambleText } from '@components/scramble-text';
import { SectionHeading } from '@components/section-heading';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Static page; its content is sourced from the repo's
// own rules, not the CMS.
export const revalidate = 3600;

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return colophon.title;
    },
    get description() {
      return colophon.description;
    },
    alternates: { canonical: '/colophon' },
  };
};

const ColophonPage = () => {
  return (
    <>
      <section className={s.cell}>
        <SectionHeading no="01" more="$ cat concept.md">
          concept
        </SectionHeading>
        <p className={s.intro}>{colophon.concept.intro}</p>
        <Manifesto items={colophon.concept.points} />
      </section>

      <section className={s.cell}>
        <SectionHeading no="02" more="$ ls components/">
          ui
        </SectionHeading>
        <p className={s.intro}>{colophon.components.intro}</p>
        <ul className={s.ambientList}>
          {colophon.components.ambient.map((item) => (
            <AmbientPointer key={item.target} label={item.label} target={item.target} />
          ))}
        </ul>
        <div className={s.demoGrid}>
          {colophon.components.items.map((item) => (
            <ComponentDemo key={item.name} name={item.name} why={item.why}>
              {demos[item.name]}
            </ComponentDemo>
          ))}
        </div>
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
    </>
  );
};

export default ColophonPage;
