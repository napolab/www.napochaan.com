import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import { ErrorScreen } from './index';
import { RetryButton } from './retry-button';
import * as s from './styles.css';

// Ports of the Next `(site)/not-found.tsx` and `(site)/error.tsx` screens. Server
// Components: src/pages/404.astro and 500.astro render their `.astro` twins
// (not-found-screen.astro / server-error-screen.astro), which hydrate only the
// ScrambleText label and the retry button.

const HomeLink = () => (
  <Link href="/" tone="accent" className={s.homeLink}>
    ← <ScrambleText>/ へ戻る</ScrambleText>
  </Link>
);

export const NotFoundScreen = () => (
  <ErrorScreen code="404" kind="not found" lead="お探しのページは存在しないか、移動した可能性があります。" tag="▸ not found">
    <HomeLink />
  </ErrorScreen>
);

type ServerErrorProps = { reload?: () => void };

export const ServerErrorScreen = ({ reload }: ServerErrorProps) => (
  <ErrorScreen code="500" kind="runtime error" lead="予期しないエラーが発生しました。" tag="■ rec stopped">
    <RetryButton reload={reload} />
    <HomeLink />
  </ErrorScreen>
);
