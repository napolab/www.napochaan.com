import type React from "react";

export default async (instance: typeof React) => {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const dev = await import("./report-accessibility.dev");
    await dev.default(instance);
  }
};
