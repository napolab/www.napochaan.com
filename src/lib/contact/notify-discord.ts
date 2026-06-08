import type { ContactInput } from './schema';

type DiscordEnv = { DISCORD_WEBHOOK_URL: string };

const DESCRIPTION_LIMIT = 4000;

const truncate = (value: string, limit: number): string => {
  if (value.length <= limit) return value;

  return value.slice(0, limit);
};

const buildBody = (input: ContactInput): string => {
  return JSON.stringify({
    embeds: [
      {
        title: 'お問い合わせがありました',
        description: truncate(input.message, DESCRIPTION_LIMIT),
        fields: [
          { name: 'お名前', value: input.name, inline: true },
          { name: '返信先', value: input.email, inline: true },
        ],
      },
    ],
  });
};

export const notifyDiscord = async (input: ContactInput, env: DiscordEnv): Promise<void> => {
  try {
    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildBody(input),
    });

    if (!response.ok) {
      console.error(`Discord notification failed with status ${response.status}`);

      return;
    }
  } catch (error) {
    console.error('Discord notification threw an error', error);
  }
};
