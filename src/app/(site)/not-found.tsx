import { ErrorScreen } from './_components/error-screen';
import * as s from './_components/error-screen/styles.css';

const NotFound = () => (
  <ErrorScreen code="404" kind="not found" lead="お探しのページは存在しないか、移動した可能性があります。" tag="▸ not found">
    <a href="/" className={s.homeLink}>
      ← / へ戻る
    </a>
  </ErrorScreen>
);

export default NotFound;
