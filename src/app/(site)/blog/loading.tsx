import { DecodingSkeleton } from '@components/decoding-skeleton';

// The shared `<main>` lives in `blog/layout.tsx`; this fallback renders inside it.
const Loading = () => <DecodingSkeleton fill />;

export default Loading;
