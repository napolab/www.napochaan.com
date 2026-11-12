'use client';

import { Button } from '@components/button';
import { SystemAnnotation } from '@components/system-annotation';

import * as s from './styles.css';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const WorksError = ({ reset }: Props) => (
  <section className={s.errorSection} aria-label="読み込みエラー">
    <SystemAnnotation tone="danger">■ works の読み込みに失敗しました</SystemAnnotation>
    <Button variant="danger" onPress={reset}>
      retry
    </Button>
  </section>
);

export default WorksError;
