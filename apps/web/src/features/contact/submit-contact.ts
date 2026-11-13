import { notifyDiscord } from '@lib/contact/notify-discord';
import { contactSchema } from '@lib/contact/schema';
import { sendContactEmail } from '@lib/contact/send-email';
import { verifyTurnstile } from '@lib/contact/verify-turnstile';

import type { ContactResult } from './state';

// The bindings the submission reads (a subset of Cloudflare.Env).
export type ContactEnv = {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  CONTACT_FROM_EMAIL: string;
  CONTACT_TO_EMAIL: string;
  DISCORD_WEBHOOK_URL: string;
};

const SEND_FAILED = '送信に失敗しました。しばらくして再度お試しください。';

const readField = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === 'string' ? value : '';
};

const readValues = (formData: FormData) => ({
  name: readField(formData, 'name'),
  email: readField(formData, 'email'),
  message: readField(formData, 'message'),
});

// Port of the Next Server Action (apps/web contact/_actions/submit-contact.ts), same
// order: Turnstile (server-side siteverify) → zod schema → RESEND_API_KEY → email →
// Discord. Nothing here logs the message body or a secret.
export const submitContact = async (formData: FormData, env: ContactEnv, remoteIP: string | undefined): Promise<ContactResult> => {
  const values = readValues(formData);

  const verified = await verifyTurnstile(readField(formData, 'cf-turnstile-response'), env, remoteIP);
  if (!verified) return { status: 'error', message: '認証を確認できませんでした。もう一度お試しください。', values };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { status: 'error', message: '入力内容を確認してください', fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');

    return { status: 'error', message: SEND_FAILED, values };
  }

  const result = await sendContactEmail(parsed.data, env);
  if (!result.ok) return { status: 'error', message: SEND_FAILED, values };

  await notifyDiscord(parsed.data, env);

  return { status: 'success' };
};
