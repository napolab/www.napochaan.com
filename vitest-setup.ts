import "vitest-axe/extend-expect";
import "vitest-canvas-mock";
import "@testing-library/jest-dom/extend-expect";
import "@testing-library/jest-dom";
import "jest-extended";

// vitest-setup.js
import { expect } from "vitest";
import * as matchers from "vitest-axe/matchers";

expect.extend(matchers);
