'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';

import { contactSchema } from '@lib/contact/schema';
import { notifyDiscord } from '@lib/contact/notify-discord';
import { sendContactEmail } from '@lib/contact/send-email';

import type { ContactState } from './state';

const readField = (fd: FormData, key: string): string => {
  const value = fd.get(key);

  return typeof value === 'string' ? value : '';
};

export const submitContact = async (_prev: ContactState, formData: FormData): Promise<ContactState> => {
  const values = {
    name: readField(formData, 'name'),
    email: readField(formData, 'email'),
    message: readField(formData, 'message'),
  };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: 'error',
      message: '入力内容を確認してください',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values,
    };
  }

  const { env } = await getCloudflareContext({ async: true });
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');

    return { status: 'error', message: '送信に失敗しました。しばらくして再度お試しください。', values };
  }

  const result = await sendContactEmail(parsed.data, env);
  if (!result.ok) {
    return { status: 'error', message: '送信に失敗しました。しばらくして再度お試しください。', values };
  }

  await notifyDiscord(parsed.data, env);

  return { status: 'success' };
};
