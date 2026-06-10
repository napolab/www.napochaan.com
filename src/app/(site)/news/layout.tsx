import * as s from './styles.css';

import type { ReactNode } from 'react';

// Owns the single `<main>` landmark shared by the list page, loading, and error
// states. The page header (title / kicker / lead / RSS) lives in `page.tsx` so it
// renders for the list only — never leaking onto the detail/preview routes, which
// bring their own header via `NewsDetail`.
const NewsLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    {children}
  </main>
);

export default NewsLayout;
