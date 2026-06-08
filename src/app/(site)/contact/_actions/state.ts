export type ContactState = {
  status: 'idle' | 'success' | 'error';
  message?: string; // general (non-field) error message
  fieldErrors?: Record<string, string[]>; // keyed by field name: name/email/message
  values?: { name: string; email: string; message: string }; // to repopulate on error
};

export const initialContactState: ContactState = { status: 'idle' };
