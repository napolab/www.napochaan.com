import { fontVariables } from '@themes/fonts';
import { ThemeProvider } from '@themes/provider';

import type { ReactNode } from 'react';

const DesignSystemLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="ja" className={fontVariables}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/izz7men.css" />
      </head>
      <ThemeProvider asChild>
        <body>{children}</body>
      </ThemeProvider>
    </html>
  );
};

export default DesignSystemLayout;
