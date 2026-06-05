import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';

import config from '@payload-config';

import { importMap } from './admin/importMap';

import type { Metadata } from 'next';
import type { ServerFunctionClient } from 'payload';
import type { ReactNode } from 'react';

import '@payloadcms/next/css';

type Props = {
  children: ReactNode;
};

const serverFunction: ServerFunctionClient = async (args) => {
  'use server';

  return handleServerFunctions({ ...args, config, importMap });
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const Layout = ({ children }: Props) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
