"use client";
import { useSyncExternalStore } from "react";

import * as source from "../source";

import { AnimatedDecorationImage } from "./animated-decoration-image";

import type { ReactNode } from "react";

interface ContactAwareRootProps {
  children: ReactNode;
}

export const ContactAwareRoot = ({ children }: ContactAwareRootProps) => {
  const contactInView = useSyncExternalStore(
    (onStoreChange) => source.contactInView.subscribe(onStoreChange),
    () => source.contactInView.getState(),
    () => false,
  );

  return <AnimatedDecorationImage contactInView={contactInView}>{children}</AnimatedDecorationImage>;
};
