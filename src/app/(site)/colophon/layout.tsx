import { colophon } from './content';
import * as s from './styles.css';

import { PageHeader } from '@components/page-header';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'colophon' }];

const ColophonLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main id="main-content" className={s.main}>
      <PageHeader title={colophon.title} breadcrumbs={crumbs} kicker={colophon.kicker} lead={colophon.lead} leadReveal="scramble" annotation="この世界だけに閉じている" />
      {children}
    </main>
  );
};

export default ColophonLayout;
