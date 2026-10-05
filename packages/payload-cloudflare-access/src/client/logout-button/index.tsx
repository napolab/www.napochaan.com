'use client';

import { Logout } from '@payloadcms/ui';

import type { ReactElement } from 'react';

export type LogoutButtonProps = {
  accessLogout: boolean;
};

export const LogoutButton = (_props: LogoutButtonProps): ReactElement => <Logout />;
