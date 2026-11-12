import { Breadcrumbs } from '@components/breadcrumbs';

import * as s from './styles.css';

import type { ReactNode } from 'react';

const crumbs = [{ href: '/', label: 'home' }, { label: 'about' }];

type Props = {
  children: ReactNode;
};

const AboutLayout = ({ children }: Props) => {
  return (
    <main id="main-content" className={s.main}>
      <Breadcrumbs items={crumbs} />
      {children}
    </main>
  );
};

export default AboutLayout;
