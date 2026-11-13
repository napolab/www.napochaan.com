import { ScrambleText } from '@components/scramble-text';

import * as s from '../../styles.css';

type Props = {
  href: string;
  label: string;
  handle: string;
};

// The `04 source` repository link: label + handle, each with the shared scramble.
export const SourceLink = ({ href, label, handle }: Props) => (
  <a className={s.source} href={href} target="_blank" rel="noopener noreferrer">
    <span className={s.sourceLabel}>
      <ScrambleText>{label}</ScrambleText>
    </span>
    <span className={s.sourceHandle}>
      <ScrambleText>{handle}</ScrambleText>
    </span>
    <span aria-hidden="true">↗</span>
  </a>
);
