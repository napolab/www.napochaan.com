import { Image } from '@components/image';
import { RichText } from '@components/rich-text';

import * as s from './styles.css';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type WorkDetailData = {
  title: string;
  type: string;
  year: number;
  no: string;
  thumbnail?: { src: string; width: number; height: number };
  body?: SerializedEditorState;
};

type Props = {
  work: WorkDetailData;
};

// The detail body of a single work: a large contact-sheet proof image, a mono
// spec ledger (type / year / no), then the body prose rendered as Payload-Lexical
// rich text. Pure Server Component — no react-aria, no interactivity — so it stays
// out of the client bundle. The page <h1> lives in PageHeader, so this renders no
// heading.
export const WorkDetail = ({ work }: Props) => {
  const { thumbnail, body } = work;

  return (
    <section className={s.root} aria-label="work detail">
      <figure className={s.figureRoot}>
        {thumbnail === undefined ? (
          <span className={s.imagePlaceholder} aria-hidden="true" />
        ) : (
          <Image src={thumbnail.src} alt={work.title} width={thumbnail.width} height={thumbnail.height} className={s.image} />
        )}
      </figure>

      <dl className={s.spec}>
        <dt className={s.specTerm}>type</dt>
        <dd className={s.specDesc}>{work.type}</dd>
        <dt className={s.specTerm}>year</dt>
        <dd className={s.specDesc}>{work.year}</dd>
        <dt className={s.specTerm}>no</dt>
        <dd className={s.specDesc}>{work.no}</dd>
      </dl>

      {body === undefined ? null : <RichText data={body} className={s.body} />}
    </section>
  );
};
