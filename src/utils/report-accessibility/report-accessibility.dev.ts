import axe from "@axe-core/react";
import ReactDOM from "react-dom";

import type React from "react";

export default async (instance: typeof React) => {
  await axe(instance, ReactDOM, 1000);
};
