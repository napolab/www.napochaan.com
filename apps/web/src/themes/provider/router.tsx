'use client';

import { useRouter } from 'next/navigation';
import { RouterProvider } from 'react-aria-components';

import type { ReactNode } from 'react';

export const ClientRouter = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  return <RouterProvider navigate={router.push}>{children}</RouterProvider>;
};
