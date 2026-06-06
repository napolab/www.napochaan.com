'use client';

import { Button } from '@components/button';

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
    <a href="/" className={s.homeLink}>
      ← / へ戻る
    </a>
  </ErrorScreen>
);

export default ErrorPage;
