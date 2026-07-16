'use client';

import { useActionState } from 'react';
import { Form } from 'react-aria-components';

import { Button } from '@components/button';
import { TextField } from '@components/text-field';

import { authorize, initialAuthorizeState } from '../../_actions/authorize';
import * as styles from './styles.css';

type Props = {
  authRequestQuery: string;
  clientName: string;
};

export const AuthorizeForm = ({ authRequestQuery, clientName }: Props) => {
  const [state, formAction, isPending] = useActionState(authorize, initialAuthorizeState);

  return (
    <Form action={formAction} className={styles.form}>
      <input type="hidden" name="authRequestQuery" value={authRequestQuery} />
      <p className={styles.lead}>{clientName} が blog 入稿ツール(記事の作成・更新・公開、画像アップロード)へのアクセスを要求しています。</p>
      <TextField name="email" type="email" label="email" isRequired autoComplete="email" />
      <TextField name="password" type="password" label="password" isRequired autoComplete="current-password" />
      {state.status === 'error' ? (
        <p role="alert" className={styles.error}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" isDisabled={isPending}>
        許可する
      </Button>
    </Form>
  );
};
