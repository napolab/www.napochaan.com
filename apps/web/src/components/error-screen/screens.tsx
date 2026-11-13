import { withAppProviders } from '@components/app-providers';
import { Button } from '@components/button';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import { ErrorScreen } from './index';
import * as s from './styles.css';

// Ports of the Next `(site)/not-found.tsx` and `(site)/error.tsx` screens, rendered
// by src/pages/404.astro and src/pages/500.astro. Islands so the home link navigates
// softly and the scramble / retry are interactive.

const HomeLink = () => (
  <Link href="/" tone="accent" className={s.homeLink}>
    ← <ScrambleText>/ へ戻る</ScrambleText>
  </Link>
);

const NotFoundScreen = () => (
  <ErrorScreen code="404" kind="not found" lead="お探しのページは存在しないか、移動した可能性があります。" tag="▸ not found">
    <HomeLink />
  </ErrorScreen>
);

const reloadPage = (): void => {
  location.reload();
};

// Next's `reset()` re-rendered the failed segment; a server-rendered Astro page has
// no client segment to reset, so retry reloads the document. `reload` is injectable
// for tests (functions cannot cross the island props boundary anyway).
type ServerErrorProps = { reload?: () => void };

const ServerErrorScreen = ({ reload = reloadPage }: ServerErrorProps) => (
  <ErrorScreen code="500" kind="runtime error" lead="予期しないエラーが発生しました。" tag="■ rec stopped">
    <Button variant="danger" onPress={reload}>
      retry
    </Button>
    <HomeLink />
  </ErrorScreen>
);

export const NotFoundIsland = withAppProviders(NotFoundScreen);
export const ServerErrorIsland = withAppProviders(ServerErrorScreen);
