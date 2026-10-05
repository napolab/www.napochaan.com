'use client';

import { useActionState } from 'react';
import { Form } from 'react-aria-components';

import { Button } from '@components/button';

import { authorizeWithAccess } from '../../_actions/authorize';
import { initialAuthorizeState } from '../../_actions/state';
import * as styles from './styles.css';

type Props = {
  authRequestQuery: string;
  clientName: string;
  email: string;
};

// Cloudflare Access 経由のリクエスト用。資格情報は入力させず、Access が確認済みの
// email で承認するだけ。user は action 側で headers から取り直す(form の値は信用しない)。
export const AccessAuthorizeForm = ({ authRequestQuery, clientName, email }: Props) => {
  const [state, formAction, isPending] = useActionState(authorizeWithAccess, initialAuthorizeState);

  return (
    <Form action={formAction} className={styles.form}>
      <input type="hidden" name="authRequestQuery" value={authRequestQuery} />
      <p className={styles.lead}>{clientName} が blog 入稿ツール(記事の作成・更新・公開、画像アップロード)へのアクセスを要求しています。</p>
      {state.status === 'error' ? (
        <p role="alert" className={styles.error}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" isDisabled={isPending}>
        {email} として許可する
      </Button>
    </Form>
  );
};
