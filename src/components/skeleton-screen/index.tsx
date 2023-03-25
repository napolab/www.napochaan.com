import { forwardRef, memo } from "react";

import type { FC } from "react";

export type SkeletonScreenProps = {
  loading?: boolean;
  children: React.ReactNode;
};
const SkeletonScreen = forwardRef<HTMLDivElement, SkeletonScreenProps>(({ loading, children }, ref) => {
  return (
    <div ref={ref}>
      <div aria-hidden="true" />
      <div aria-busy={loading ? "true" : "false"}>{children}</div>
    </div>
  );
}) satisfies FC<SkeletonScreenProps>;

export default memo(SkeletonScreen);
