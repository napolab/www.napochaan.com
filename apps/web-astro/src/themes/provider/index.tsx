import { Slot } from '@radix-ui/react-slot';

import { ClientRouter } from './router';
import * as s from './styles.css';

import type { ReactNode } from 'react';

import '@themes/global.css';

type Props = {
  children: ReactNode;
  asChild?: boolean;
};

export const ThemeProvider = ({ children, asChild }: Props) => {
  const Comp = asChild ? Slot : 'div';

  return (
    <ClientRouter>
      <Comp className={s.root}>{children}</Comp>
    </ClientRouter>
  );
};
