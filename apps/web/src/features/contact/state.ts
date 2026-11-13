// Port of apps/web/src/app/(site)/contact/_actions/state.ts. The server action returns
// `ContactResult` (no `attempt`: Astro Actions have no previous state); the form's
// `useActionState` reducer stamps `attempt` (see components/contact-form/submit).
export type ContactState = {
  status: 'idle' | 'success' | 'error';
  message?: string; // general (non-field) error message
  fieldErrors?: Record<string, string[]>; // keyed by field name: name/email/message
  values?: { name: string; email: string; message: string }; // to repopulate on error
  attempt?: number; // increments on every error return; used to remount the Turnstile widget for a fresh token
};

export type ContactResult = Omit<ContactState, 'attempt'>;

export const initialContactState: ContactState = { status: 'idle', attempt: 0 };
