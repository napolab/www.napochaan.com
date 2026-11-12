import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

// Disables Next draft mode and returns to the home page. Pair to the preview
// handshake at `/next/preview` — exiting Live Preview lands the user back on the
// public, ISR-cached site.
export const GET = async (): Promise<Response> => {
  const draft = await draftMode();
  draft.disable();
  redirect('/');
};
