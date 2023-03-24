// import ShowCase from "." の test を作成する

import { render } from "@testing-library/react";
import { axe } from "vitest-axe";

import ShowCase from ".";



it("axe", async () => {
  const { container } = render(<ShowCase items={[]} />);
  expect(await axe(container)).toHaveNoViolations();
});