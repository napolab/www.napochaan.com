"use client";
import { createContext, useContext } from "react";

import type { PropsWithChildren, FC } from "react";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
const LevelContext = createContext<HeadingLevel | null>(null);

type HeadingLevelProviderProps = {
  level?: HeadingLevel;
};
export const HeadingLevelProvider: FC<PropsWithChildren<HeadingLevelProviderProps>> = ({ children, level = null }) => {
  return <LevelContext.Provider value={level}>{children}</LevelContext.Provider>;
};

export const useHeadingLevel = () => {
  return useContext(LevelContext);
};

export const isHeadingLevel = (value: unknown): value is HeadingLevel => {
  return typeof value === "number" && [1, 2, 3, 4, 5, 6].includes(value);
};
