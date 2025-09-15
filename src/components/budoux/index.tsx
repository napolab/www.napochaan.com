import dynamic from "next/dynamic";
import { forwardRef, memo, Suspense } from "react";

import Fallback from "./fallback";

import type { FC, ComponentPropsWithoutRef } from "react";

const Client = dynamic(() => import("./client"), {
  ssr: false,
});

type Props = Omit<ComponentPropsWithoutRef<"span">, "children" | "className" | "style"> & {
  children: string;
};

const Budoux = forwardRef<HTMLSpanElement, Props>(({ children, ...props }, ref) => (
  <Suspense fallback={<Fallback {...props}>{children}</Fallback>}>
    <Client {...props} ref={ref}>
      {children}
    </Client>
  </Suspense>
)) satisfies FC<Props>;

export default memo(Budoux);
