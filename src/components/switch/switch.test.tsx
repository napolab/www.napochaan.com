import { render } from "@testing-library/react";
import { axe } from "vitest-axe";

import Component from ".";

it("default", async () => {
  const { container } = render(<Component aria-label="switch" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it("checked", async () => {
  const { container } = render(<Component aria-label="switch" checked />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it("with label", async () => {
  const { container } = render(<Component aria-label="switch" label="with label" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it("disabled", async () => {
  const { container } = render(<Component aria-label="switch" disabled />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it("readonly", async () => {
  const { container } = render(<Component aria-label="switch" readonly />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
