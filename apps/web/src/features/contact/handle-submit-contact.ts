import { getRequestContext } from '@lib/request-context';

import { submitContact } from './submit-contact';

import type { ContactResult } from './state';

type ActionRequestContext = { request: Request };

// The `submitContact` Astro Action body (src/actions). Secrets come from the worker's
// per-request context — never `cloudflare:workers` — and the visitor IP from the
// header Cloudflare stamps (Next read it through `headers()`).
export const handleSubmitContact = async (formData: FormData, { request }: ActionRequestContext): Promise<ContactResult> => {
  const { env } = getRequestContext();

  return submitContact(formData, env, request.headers.get('CF-Connecting-IP') ?? undefined);
};
