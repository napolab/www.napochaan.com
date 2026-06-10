import * as s from './styles.css';

import type { ReactNode } from 'react';

// Owns the single `<main>` landmark shared by the list, loading, error, detail,
// and preview routes. Page-specific headers (list "blog" header, article header)
// live in each page so they never leak across routes — every route renders
// content only, keeping one `<main>` / one `<h1>` in every state.
const BlogLayout = ({ children }: { children: ReactNode }) => (
  <main id="main-content" className={s.main}>
    {children}
  </main>
);

export default BlogLayout;
