import { withAppProviders } from '@components/app-providers';

import { LogCalendar } from './index';

// `LogCalendar` is a client leaf ('use client' in apps/web): the only kind of component
// a page may hydrate. Placed from `.astro`; see components/app-providers. The closed
// popover server-renders only its trigger, so the Calendar (and its "today") is first
// computed in the browser when the visitor opens it, as in Next.
export const LogCalendarIsland = withAppProviders(LogCalendar);
