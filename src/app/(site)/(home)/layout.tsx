import * as s from '../styles.css';

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

const HomeLayout = ({ children }: Props) => {
  return (
    <main id="main-content" className={s.main}>
      <h1 className={s.srOnly}>napochaan — DJ・VJ・グラフィック・デジタル</h1>
      {children}
    </main>
  );
};

export default HomeLayout;
