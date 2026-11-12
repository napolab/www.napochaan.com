import { PageHeaderBase } from './base';

import type { PageHeaderBaseProps } from './base';

// Public surface of the default PageHeader: everything PageHeaderBase accepts
// except the 'tight' tracking variant and the titleClassName it requires — those
// are only reachable via TightPageHeader (./tight.tsx). This keeps a plain
// PageHeader import (used by every index/list-page layout) from being able to
// request the Zen Kaku Gothic New title font at all, at the type level.
type Props = Omit<PageHeaderBaseProps, 'titleTracking' | 'titleClassName'> & {
  titleTracking?: 'wide';
};

export const PageHeader = (props: Props) => {
  return <PageHeaderBase {...props} />;
};
