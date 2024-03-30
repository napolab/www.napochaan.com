import "vitest-axe/extend-expect";
import "vitest-canvas-mock";
import "jest-extended";
import "@testing-library/jest-dom";

// vitest-setup.js
import { expect } from "vitest";
import * as matchers from "vitest-axe/matchers";

import type { AxeMatchers } from "vitest-axe/matchers";

expect.extend(matchers);

declare module "vitest" {
  export interface Assertion extends AxeMatchers {}
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}
