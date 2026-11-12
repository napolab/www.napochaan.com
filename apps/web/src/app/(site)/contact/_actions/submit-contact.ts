'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { headers } from 'next/headers';

import { contactSchema } from '@lib/contact/schema';
import { notifyDiscord } from '@lib/contact/notify-discord';
import { sendContactEmail } from '@lib/contact/send-email';
import { verifyTurnstile } from '@lib/contact/verify-turnstile';

import type { ContactState } from './state';

const readField = (fd: FormData, key: string): string => {
  const value = fd.get(key);

  return typeof value === 'string' ? value : '';
};

const resolveRemoteIp = async (): Promise<string | undefined> => {
  const headerList = await headers();

  return headerList.get('CF-Connecting-IP') ?? undefined;
};

export const submitContact = async (prev: ContactState, formData: FormData): Promise<ContactState> => {
  const nextAttempt = (prev.attempt ?? 0) + 1;
  const values = {
    name: readField(formData, 'name'),
    email: readField(formData, 'email'),
    message: readField(formData, 'message'),
  };

  const { env } = await getCloudflareContext({ async: true });

  const verified = await verifyTurnstile(readField(formData, 'cf-turnstile-response'), env, await resolveRemoteIp());
  if (!verified) {
    return { status: 'error', message: '認証を確認できませんでした。もう一度お試しください。', values, attempt: nextAttempt };
  }

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: 'error',
      message: '入力内容を確認してください',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values,
      attempt: nextAttempt,
    };
  }

  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');

    return { status: 'error', message: '送信に失敗しました。しばらくして再度お試しください。', values, attempt: nextAttempt };
  }

  const result = await sendContactEmail(parsed.data, env);
  if (!result.ok) {
    return { status: 'error', message: '送信に失敗しました。しばらくして再度お試しください。', values, attempt: nextAttempt };
  }

  await notifyDiscord(parsed.data, env);

  return { status: 'success' };
};
