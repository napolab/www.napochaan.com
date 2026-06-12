import { AmbientBackdrop } from '@components/ambient-backdrop';
import { Figure } from '@components/figure';
import { formatBlurURL } from '@components/image/helper';
import { RichText } from '@components/rich-text';

import * as s from './styles.css';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type WorkDetailData = {
  title: string;
  type: string;
  year: number;
  thumbnail?: { src: string; width: number; height: number };
  body?: SerializedEditorState;
};

type Props = {
  work: WorkDetailData;
};

// The detail body of a single work: a uniform contact-sheet proof image, a mono
// spec ledger (type / year), then the body prose rendered as Payload-Lexical rich
// text. The thumbnail reuses the shared `Figure` frame in its `cover` variant — a
// blurred copy of the image fills the 16/10 letterbox gaps so the page behind never
// shows through, and a gallery-style `type / year` corner tag sits over it. The same
// frame (and 2px border) is shared with the in-body images. When the work has no
// thumbnail, a matching placeholder block stands in (Figure requires a src). Pure
// Server Component — no react-aria, no interactivity — so it stays out of the client
// bundle. The page <h1> lives in PageHeader, so this renders no heading.
export const WorkDetail = ({ work }: Props) => {
  const { thumbnail, body } = work;

  return (
    <section className={s.root} aria-label="work detail">
      {thumbnail === undefined ? null : <AmbientBackdrop src={thumbnail.src} />}
      {thumbnail === undefined ? (
        <span className={s.imagePlaceholder} aria-hidden="true" />
      ) : (
        <Figure
          src={thumbnail.src}
          alt={work.title}
          width={thumbnail.width}
          height={thumbnail.height}
          variant="cover"
          caption={`${work.type} / ${work.year}`}
          placeholder="blur"
          blurDataURL={formatBlurURL(thumbnail.src, { blur: 20 })}
        />
      )}

      <p className={s.meta}>
        {work.type} · {work.year}
      </p>

      {body === undefined ? null : <RichText data={body} className={s.body} />}
    </section>
  );
};
