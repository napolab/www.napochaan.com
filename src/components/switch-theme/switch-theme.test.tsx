import { render } from "@testing-library/react";
import { axe } from "vitest-axe";

import SwitchTheme from ".";

it("defaultTheme light", async () => {
  const { container } = render(<SwitchTheme defaultTheme="light" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it("theme light", async () => {
  const { container } = render(<SwitchTheme theme="light" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it("defaultTheme dark", async () => {
  const { container } = render(<SwitchTheme defaultTheme="dark" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it("theme dark", async () => {
  const { container } = render(<SwitchTheme theme="dark" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
