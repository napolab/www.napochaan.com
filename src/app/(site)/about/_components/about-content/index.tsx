import { notFound } from 'next/navigation';

import { AboutMasthead } from '../about-masthead';
import { SkillMatrix } from '../skill-matrix';
import { TagCloud } from '../tag-cloud';
import { Whoami } from '../whoami';

import { ContactList } from '@components/contact-list';
import { RichText } from '@components/rich-text';
import { SectionHeading } from '@components/section-heading';
import { findProfile } from '@lib/payload/profile';

import * as s from '../../styles.css';

import type { Profile } from '../../_lib/profile';

const buildWhoamiRows = (profile: Profile) => [
  { term: 'name', description: profile.name },
  { term: 'aka', description: profile.aka },
  { term: 'now', description: profile.now },
  { term: 'team', description: profile.team },
];

export const AboutContent = async () => {
  const profile = await findProfile();
  if (profile === undefined) notFound();

  const whoamiRows = buildWhoamiRows(profile);

  return (
    <>
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
          {profile.bio !== undefined && <RichText data={profile.bio} />}
        </section>
      </div>

      <section className={s.cell}>
        <SectionHeading no="03" more="$ cat philosophy.md">
          philosophy
        </SectionHeading>
        {profile.philosophy !== undefined && <RichText data={profile.philosophy} />}
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
    </>
  );
};
