import { AmbientBackdrop } from '@components/ambient-backdrop';
import { Figure } from '@components/figure';
import { formatBlurURL } from '@components/image/helper';

type Props = {
  thumbnail: { src: string; width: number; height: number };
  title: string;
  caption: string;
};

// The blog detail hero: the post's thumbnail in the shared `Figure` `cover` frame
// (a blurred copy fills the 16/10 letterbox gaps, a corner caption tag sits over it),
// backed by the shared `AmbientBackdrop` — a fixed, heavily-blurred wash of the same
// image. This is the works-detail treatment so blog and works detail pages read as one
// family. Pure Server Component — the page <h1> lives in PageHeader, so it renders no
// heading.
export const BlogHero = ({ thumbnail, title, caption }: Props) => {
  return (
    <>
      <AmbientBackdrop src={thumbnail.src} />
      <Figure
        src={thumbnail.src}
        alt={title}
        width={thumbnail.width}
        height={thumbnail.height}
        variant="cover"
        caption={caption}
        placeholder="blur"
        blurDataURL={formatBlurURL(thumbnail.src, { blur: 20 })}
      />
    </>
  );
};
