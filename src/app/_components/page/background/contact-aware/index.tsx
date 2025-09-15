"use client";
import { useSyncExternalStore } from "react";

import * as source from "../../source";
import { DecorationImage } from "../decoration-image";

import type { ReactNode } from "react";

type ContactAwareProps = {
  children: ReactNode;
};

export const ContactAware = ({ children }: ContactAwareProps) => {
  const contactInView = useSyncExternalStore(
    (onStoreChange) => source.contactInView.subscribe(onStoreChange),
    () => source.contactInView.getState(),
    () => false,
  );

  return <DecorationImage contactInView={contactInView}>{children}</DecorationImage>;
};
