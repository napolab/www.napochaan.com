import { AboutMasthead } from './_components/about-masthead';
import { ContactList } from './_components/contact-list';
import { SkillMatrix } from './_components/skill-matrix';
import { TagCloud } from './_components/tag-cloud';
import { Whoami } from './_components/whoami';
import { profile } from './profile';
import * as s from './styles.css';

import { Breadcrumbs } from '@components/breadcrumbs';
import { RichText } from '@components/rich-text';
import { SectionHeading } from '@components/section-heading';

import type { Metadata } from 'next';

// Revalidate hourly — ISR. Static page (no searchParams). Replaced by a Payload
// `global(profile)` query later.
export const revalidate = 3600;

// Built at module scope so it isn't re-created as an inline JSX array prop
// (react-perf/jsx-no-new-array-as-prop).
const whoamiRows = [
  { term: 'name', description: profile.name },
  { term: 'aka', description: profile.aka },
  { term: 'now', description: profile.now },
  { term: 'team', description: profile.team },
];

const crumbs = [{ href: '/', label: 'home' }, { label: 'about' }];

export const generateMetadata = (): Metadata => {
  return {
    get title() {
      return 'about';
    },
    get description() {
      return profile.tagline;
    },
  };
};

const AboutPage = () => {
  return (
    <main id="main-content" className={s.main}>
      <Breadcrumbs items={crumbs} />
      <AboutMasthead name={profile.name} kicker="// フルスタックエンジニア · DJ · VJ — リアル / VR" lead={profile.tagline} />

      <div className={s.topGrid}>
        <section className={s.cell}>
          <SectionHeading no="01" more="$ whoami">
            whoami
          </SectionHeading>
          <Whoami items={whoamiRows} />
        </section>
        <section className={s.cell}>
          <SectionHeading no="02" more="$ cat bio.md">
            bio
          </SectionHeading>
          <RichText data={profile.bio} />
        </section>
      </div>

      <section className={s.cell}>
        <SectionHeading no="03" more="$ cat philosophy.md">
          philosophy
        </SectionHeading>
        <RichText data={profile.philosophy} />
      </section>

      <section className={s.cell}>
        <SectionHeading no="04" more="$ ls love/">
          love
        </SectionHeading>
        <TagCloud items={profile.love} />
      </section>

      <section className={s.cell}>
        <SectionHeading no="05" more="$ ls skill/">
          skill
        </SectionHeading>
        <SkillMatrix groups={profile.skillGroups} />
      </section>

      <section className={s.cell}>
        <SectionHeading no="06">contact</SectionHeading>
        <ContactList items={profile.contacts} />
      </section>
    </main>
  );
};

export default AboutPage;
