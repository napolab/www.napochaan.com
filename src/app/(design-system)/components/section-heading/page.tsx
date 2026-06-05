import { css } from '@styled/css';

import { SectionHeading } from '@components/section-heading';

const wrap = css({ display: 'flex', flexDirection: 'column', gap: 'block', p: 'page' });
const heading = css({ fontFamily: 'display', fontSize: 'h2' });
const caption = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', marginTop: 'element' });
const stack = css({ display: 'flex', flexDirection: 'column', gap: 'block' });

const SectionHeadingShowcase = () => {
  return (
    <main className={wrap}>
      <h1 className={heading}>SectionHeading</h1>
      <section aria-label="Examples">
        <div className={stack}>
          <SectionHeading no="01" level={2}>
            works
          </SectionHeading>
          <SectionHeading no="02" level={2} more="view all →">
            news
          </SectionHeading>
          <SectionHeading no="03" level={3}>
            about
          </SectionHeading>
        </div>
        <p className={caption}>
          Mono-spaced number + heading title with 2px bottom rule. Optional trailing action slot via <code>more</code> prop.
        </p>
      </section>
    </main>
  );
};

export default SectionHeadingShowcase;
