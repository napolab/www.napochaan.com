import type { ContactInput } from './schema';

type SendEmailEnv = {
  RESEND_API_KEY: string;
  CONTACT_FROM_EMAIL: string;
  CONTACT_TO_EMAIL: string;
};

type SendResult = { ok: true } | { ok: false; error: string };

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const buildText = (input: ContactInput): string => {
  return `お名前: ${input.name}\n返信先: ${input.email}\n\n${input.message}`;
};

export const sendContactEmail = async (input: ContactInput, env: SendEmailEnv): Promise<SendResult> => {
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: env.CONTACT_TO_EMAIL,
        reply_to: input.email,
        subject: `お問い合わせ: ${input.name}`,
        text: buildText(input),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`Resend request failed (${response.status}): ${detail}`);

      return { ok: false, error: `メール送信に失敗しました (status: ${response.status})` };
    }

    return { ok: true };
  } catch (error) {
    console.error('Resend request threw an error:', error);

    return { ok: false, error: 'メール送信に失敗しました' };
  }
};
