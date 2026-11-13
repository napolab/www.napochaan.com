import type { ContactState } from '../state';

// Shared by the server submission (submit-contact.ts) and the form's client-side
// reducer (components/contact-form/submit.ts); keep it free of server-only imports.

export const SEND_FAILED = '送信に失敗しました。しばらくして再度お試しください。';

type ContactValues = NonNullable<ContactState['values']>;

export const readField = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === 'string' ? value : '';
};

export const readValues = (formData: FormData): ContactValues => ({
  name: readField(formData, 'name'),
  email: readField(formData, 'email'),
  message: readField(formData, 'message'),
});
