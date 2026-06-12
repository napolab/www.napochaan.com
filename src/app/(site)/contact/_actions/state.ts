export type ContactState = {
  status: 'idle' | 'success' | 'error';
  message?: string; // general (non-field) error message
  fieldErrors?: Record<string, string[]>; // keyed by field name: name/email/message
  values?: { name: string; email: string; message: string }; // to repopulate on error
  attempt?: number; // increments on every error return; used to remount the Turnstile widget for a fresh token
};

export const initialContactState: ContactState = { status: 'idle', attempt: 0 };
