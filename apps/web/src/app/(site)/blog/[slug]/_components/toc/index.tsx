import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import * as s from './styles.css';

// Local prop shape — matches TocHeading from @components/rich-text/toc, declared
// narrowly here so the component owns its own contract.
type Heading = {
  level: number;
  text: string;
  slug: string;
};

type Props = {
  headings: readonly Heading[];
};

// In-page table of contents for the article body. A Server Component — fully static
// markup. Reading-progress colouring is pure CSS (see global-css `@supports` block):
// each `data-toc-list` link binds, by document order, to its heading's scroll-driven
// `view-timeline`, sweeping from unread (muted) → accent as the heading crosses the
// read line. Where scroll-driven animations are unsupported the links stay at their
// resting `muted` tone. The scramble is the hover signal; h3 entries indent via a
// data-level attribute. Renders nothing when the body has no headings.
export const Toc = ({ headings }: Props) => {
  if (headings.length === 0) return null;

  return (
    <nav className={s.root} aria-label="目次">
      <p className={s.label}>contents</p>
      <ol className={s.list} data-toc-list>
        {headings.map((heading) => (
          <li key={heading.slug} className={s.item} data-level={heading.level}>
            <Link href={`#${heading.slug}`} tone="muted" underline={false} className={s.link}>
              <ScrambleText>{heading.text}</ScrambleText>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
};
