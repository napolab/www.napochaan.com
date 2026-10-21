'use client';

import { LogOutIcon, Logout, useTranslation } from '@payloadcms/ui';

import styles from './styles.module.css';

import type { ReactElement } from 'react';

export type LogoutButtonProps = {
  // Access 有効時は plugin が `/api/<slug>/access-logout` を渡す。null なら Payload 既定のログアウト。
  accessLogoutAction: string | null;
};

// Access のセッションと一緒に Payload / draft mode の cookie も消すため、同一 origin の endpoint へ POST する。
// endpoint が cookie を消して /cdn-cgi/access/logout へ 303 で送る(src/logout-endpoint/index.ts)。
export const LogoutButton = ({ accessLogoutAction }: LogoutButtonProps): ReactElement => {
  const { t } = useTranslation();
  if (accessLogoutAction === null) return <Logout />;

  // `nav__log-out` + Payload の Logout と同じ icon / label で nav の見た目を揃える。素の <button> に残る UA の枠と
  // 背景は styles.module.css で消す(Payload は button を class ごとにしか reset しない)。
  return (
    <form action={accessLogoutAction} className={styles.form} method="post">
      <button aria-label={t('authentication:logOut')} className="nav__log-out" title={t('authentication:logOut')} type="submit">
        <LogOutIcon />
      </button>
    </form>
  );
};
