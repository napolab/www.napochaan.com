'use client';

import { Button } from '@components/button';
import { Link } from '@components/link';
import { ScrambleText } from '@components/scramble-text';

import { ErrorScreen } from './_components/error-screen';
import * as s from './_components/error-screen/styles.css';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage = ({ reset }: Props) => (
  <ErrorScreen code="500" kind="runtime error" lead="予期しないエラーが発生しました。" tag="■ rec stopped">
    <Button variant="danger" onPress={reset}>
      retry
    </Button>
    <Link href="/" tone="accent" fill={false} className={s.homeLink}>
      ← <ScrambleText trigger="group">/ へ戻る</ScrambleText>
    </Link>
  </ErrorScreen>
);

export default ErrorPage;
