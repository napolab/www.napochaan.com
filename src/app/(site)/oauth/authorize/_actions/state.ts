// A `'use server'` file may only export async functions (Next.js requirement:
// https://nextjs.org/docs/messages/invalid-use-server-value). The action state
// type and its initial value therefore live here, outside authorize.ts — mirroring
// the contact form's `_actions/state.ts` split.
export type AuthorizeState = {
  status: 'idle' | 'error';
  message?: string;
};

export const initialAuthorizeState: AuthorizeState = { status: 'idle' };
