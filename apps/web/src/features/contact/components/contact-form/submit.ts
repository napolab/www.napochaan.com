import { actions } from 'astro:actions';

import { readValues, SEND_FAILED } from '../../form-values';

import type { ContactResult, ContactState } from '../../state';
import type { server } from '../../../../actions';

// Typed through the actions module itself, so the call stays typed when `.astro/`
// (where `astro sync` writes the generated `astro:actions` types) is absent.
const submitContactAction: (typeof server)['submitContact'] = actions.submitContact;

// The action itself failing (network, 403 origin check, 500) — no `ContactResult`.
const transportFailure = (formData: FormData): ContactResult => ({ status: 'error', message: SEND_FAILED, values: readValues(formData) });

const callAction = async (formData: FormData): Promise<ContactResult> => {
  try {
    const { data, error } = await submitContactAction(formData);
    if (error !== undefined || data === undefined) return transportFailure(formData);

    return data;
  } catch {
    return transportFailure(formData);
  }
};

// `useActionState` reducer. Next's Server Action bumped `attempt` from its `prev`
// state; an Astro Action has none, so every non-success bumps it here (the Turnstile
// widget remounts for a fresh token).
export const submitContactForm = async (prev: ContactState, formData: FormData): Promise<ContactState> => {
  const result = await callAction(formData);
  if (result.status === 'success') return result;

  return { ...result, attempt: (prev.attempt ?? 0) + 1 };
};
