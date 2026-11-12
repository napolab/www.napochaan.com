type VerifyTurnstileEnv = { TURNSTILE_SECRET_KEY: string };

type SiteverifyResponse = { success: boolean };

const SITEVERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const buildBody = (token: string, secret: string, remoteIp?: string): FormData => {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (remoteIp !== undefined) body.append('remoteip', remoteIp);

  return body;
};

export const verifyTurnstile = async (token: string, env: VerifyTurnstileEnv, remoteIp?: string): Promise<boolean> => {
  if (token === '') return false;

  try {
    const response = await fetch(SITEVERIFY_ENDPOINT, {
      method: 'POST',
      body: buildBody(token, env.TURNSTILE_SECRET_KEY, remoteIp),
    });
    if (!response.ok) return false;

    const data = (await response.json()) as SiteverifyResponse;

    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification threw an error', error);

    return false;
  }
};
