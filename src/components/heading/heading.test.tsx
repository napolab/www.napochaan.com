import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import Section from "@components/section";

import Component from ".";

it("default", async () => {
  const { container } = render(<Component>heading</Component>, { wrapper: Section });
  const results = await axe(container);
  expect(results).toHaveNoViolations();

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("heading");
});

it("nested section", async () => {
  const { container } = render(
    <Section>
      <Component>heading</Component>
    </Section>,
    { wrapper: Section },
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();

  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("heading");
});
