import { defineAction } from 'astro:actions';

import { handleSubmitContact } from '../features/contact/handle-submit-contact';

// Astro Actions (RPC at `/_actions/<name>`, `no-store` via the worker's uncacheable
// plugin). `accept: 'form'` with no `input` schema: the handler validates with the
// contact zod schema itself, after Turnstile, so the order and the returned
// `ContactState` shape (values / fieldErrors) match the Next Server Action. An `input`
// schema would validate first and drop `cf-turnstile-response`.
export const server = {
  submitContact: defineAction({
    accept: 'form',
    handler: async (formData, context) => handleSubmitContact(formData, context),
  }),
};
