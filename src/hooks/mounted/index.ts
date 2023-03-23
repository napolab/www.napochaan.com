import { useState } from "react";

import { useIsomorphicLayoutEffect } from "@hooks/isomorphic-effect";

export const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  useIsomorphicLayoutEffect(() => setMounted(true), []);

  return mounted;
};
