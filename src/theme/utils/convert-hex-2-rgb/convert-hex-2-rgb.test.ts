import { convertHex2Rgb } from ".";

test("test pallets", () => {
  expect(
    convertHex2Rgb({
      color: "#ffffff",
      color2: "#00ff00",
      background: {
        main: "#ffffff",
        secondary: "#A5A5A5",
        nest: {
          main: "#ffffff",
          secondary: "#A5A5A5",
        },
      },
    }),
  ).toEqual({
    color: "255, 255, 255",
    color2: "0, 255, 0",
    background: {
      main: "255, 255, 255",
      secondary: "165, 165, 165",
      nest: {
        main: "255, 255, 255",
        secondary: "165, 165, 165",
      },
    },
  });
});

test("empty pallets", () => {
  expect(convertHex2Rgb({})).toEqual({});
});

test("not hex pallets", () => {
  expect(() => convertHex2Rgb({ color: "red " })).toThrow();
});
