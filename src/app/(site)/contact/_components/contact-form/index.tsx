'use client';

import { useActionState } from 'react';
import { Form } from 'react-aria-components';

import { Button } from '@components/button';
import { TextArea } from '@components/text-area';
import { TextField } from '@components/text-field';

import { submitContact } from '../../_actions/submit-contact';
import { initialContactState } from '../../_actions/state';
import * as styles from './styles.css';

export const ContactForm = () => {
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
      <div className={styles.actions}>
        <Button type="submit" isDisabled={isPending}>
          {isPending ? '送信中…' : '送信 →'}
        </Button>
      </div>
    </Form>
  );
};
