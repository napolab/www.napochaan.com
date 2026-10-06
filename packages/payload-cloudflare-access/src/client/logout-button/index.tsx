'use client';

import { LogOutIcon, Logout } from '@payloadcms/ui';
import { Link } from 'react-aria-components';

import type { ReactElement } from 'react';

export type LogoutButtonProps = {
  accessLogout: boolean;
};

// Cloudflare Access ends the session at this edge endpoint, not at Payload's own
// logout route. The admin has no RouterProvider, so this is a full-page navigation.
const ACCESS_LOGOUT_PATH = '/cdn-cgi/access/logout';

export const LogoutButton = ({ accessLogout }: LogoutButtonProps): ReactElement => {
  if (!accessLogout) return <Logout />;

  // `nav__log-out` + the same icon as Payload's own Logout keeps the nav look.
  return (
    <Link aria-label="ログアウト" className="nav__log-out" href={ACCESS_LOGOUT_PATH}>
      <LogOutIcon />
    </Link>
  );
};
