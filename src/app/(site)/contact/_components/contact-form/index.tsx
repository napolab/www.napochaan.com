'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useActionState, useCallback, useState } from 'react';
import { Form } from 'react-aria-components';

import { Button } from '@components/button';
import { TextArea } from '@components/text-area';
import { TextField } from '@components/text-field';

import { submitContact } from '../../_actions/submit-contact';
import { initialContactState } from '../../_actions/state';
import * as styles from './styles.css';

// 'auto' follows the visitor's color-scheme; 'flexible' lets the widget fill the form column.
const TURNSTILE_OPTIONS = { theme: 'auto', size: 'flexible' } as const;

type TurnstileFieldProps = {
  siteKey: string;
  isPending: boolean;
};

// Owns the verification token and the submit control together so a remount
// (keyed on the action's attempt count) clears a spent token and disables submit
// until the fresh challenge is solved.
const TurnstileField = ({ siteKey, isPending }: TurnstileFieldProps) => {
  const [token, setToken] = useState<string>();
  const clearToken = useCallback(() => setToken(undefined), []);

  return (
    <>
      <Turnstile siteKey={siteKey} onSuccess={setToken} onError={clearToken} onExpire={clearToken} options={TURNSTILE_OPTIONS} className={styles.turnstile} />
      <div className={styles.actions}>
        <Button type="submit" isDisabled={isPending || token === undefined}>
          {isPending ? '送信中…' : '送信 →'}
        </Button>
      </div>
    </>
  );
};

type ContactFormProps = {
  turnstileSiteKey: string;
};

export const ContactForm = ({ turnstileSiteKey }: ContactFormProps) => {
  const [state, formAction, isPending] = useActionState(submitContact, initialContactState);

  if (state.status === 'success') {
    return (
      <div role="status" className={styles.success}>
        送信しました。お返事をお待ちください。
      </div>
    );
  }

  return (
    <Form action={formAction} validationErrors={state.fieldErrors} className={styles.form}>
      {state.status === 'error' && state.message !== undefined ? (
        <p role="alert" className={styles.formError}>
          {state.message}
        </p>
      ) : null}
      <TextField name="name" label="name / お名前" isRequired autoComplete="name" defaultValue={state.values?.name} />
      <TextField name="email" type="email" label="email / 返信先" isRequired autoComplete="email" defaultValue={state.values?.email} />
      <TextArea name="message" rows={6} label="message / 本文" isRequired defaultValue={state.values?.message} />
      <TurnstileField key={state.attempt} siteKey={turnstileSiteKey} isPending={isPending} />
    </Form>
  );
};
