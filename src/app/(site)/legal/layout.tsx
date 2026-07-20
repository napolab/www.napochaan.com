import * as s from './styles.css';

import type { ReactNode } from 'react';

// `(site)/layout.tsx` は `<main>` を持たないため、セグメント側で唯一の main ランドマークを
// 所有する。ページ見出しは `[slug]/page.tsx` 側の LegalDocumentView が持つ。
const LegalLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    {children}
  </main>
);

export default LegalLayout;
