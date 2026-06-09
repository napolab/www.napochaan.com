import type { ReactNode } from 'react';

// Pass-through: the archive header + <main> live on the index page (works/page.tsx)
// so the detail page (works/[id]) — which renders its own <main> + PageHeader —
// doesn't inherit the "works" archive header or end up with nested <main> elements.
const WorksLayout = ({ children }: { children: ReactNode }) => children;

export default WorksLayout;
