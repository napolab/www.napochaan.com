import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import { adminFontVariables } from '@themes/fonts-admin';

import config from '@payload-config';

import { importMap } from './admin/importMap';

import type { Metadata } from 'next';
import type { ServerFunctionClient } from 'payload';
import type { ReactNode } from 'react';

import '@payloadcms/next/css';
// Admin-only overrides (LINE Seed JP on the rich-text editor). Must come after
// the Payload stylesheet so its rules take precedence.
import './custom.css';

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

// Spread onto the admin <html> so the self-hosted LINE Seed JP variable is in
// scope for the rich-text editor rule in custom.css. Hoisted for a stable ref.
const htmlProps = { className: adminFontVariables };

const Layout = ({ children }: Props) => (
  <RootLayout config={config} htmlProps={htmlProps} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
