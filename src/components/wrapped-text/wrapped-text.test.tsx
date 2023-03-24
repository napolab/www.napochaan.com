// axe によるコンポーネントテストを行う

import { render } from "@testing-library/react";
import { axe } from "vitest-axe";

import Component from ".";

it("default", async () => {
  const { container } = render(<Component texts={["Hello", "World"]} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it("wrapped", async () => {
  const { container } = render(
    <div style={{ width: 100 }}>
      <Component texts={["Hello", "World"]} />
    </div>,
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
