import * as s from './styles.css';

import type { ReactNode } from 'react';

// log 配下の共通シェル（main ランドマークと縦リズム）だけを持つ。ヘッダーは
// ページごとに違う（年表 = log ヘッダー、/log/calendar = calendar ヘッダー）ので
// 各 page.tsx の責務にしてある。
const LogLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    {children}
  </main>
);

export default LogLayout;
