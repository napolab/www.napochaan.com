import { render } from "@testing-library/react";
import { axe } from "vitest-axe";

import Component from ".";

it("default", async () => {
  const { container } = render(
    <Component orientation="horizontal">
      <div style={{ width: 160, height: 160 }}></div>
      <div style={{ width: 160, height: 160 }}></div>
      <div style={{ width: 160, height: 160 }}></div>
      <div style={{ width: 160, height: 160 }}></div>
      <div style={{ width: 160, height: 160 }}></div>
    </Component>,
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
