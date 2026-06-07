import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import { ErrorScreen } from './_components/error-screen';
import * as s from './_components/error-screen/styles.css';

const NotFound = () => (
  <ErrorScreen code="404" kind="not found" lead="お探しのページは存在しないか、移動した可能性があります。" tag="▸ not found">
    <Link href="/" tone="accent" fill={false} className={s.homeLink}>
      ← <ScrambleText trigger="group">/ へ戻る</ScrambleText>
    </Link>
  </ErrorScreen>
);

export default NotFound;
