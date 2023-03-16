import { render } from "@testing-library/react";
import { axe } from "vitest-axe";

import Component from ".";

it("default", async () => {
  const { container } = render(<Component src="https://lgtm.napochaan.com/" caption="sample text" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
