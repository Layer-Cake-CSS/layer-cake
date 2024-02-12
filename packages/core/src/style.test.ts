import { Adapter, setAdapter } from "./adapter";
import { style } from "./style";

const mockAdapter = {
  appendCss: jest.fn(),
  applyCss: jest.fn(),
  registerClassName: jest.fn(),
} satisfies Adapter;

setAdapter(mockAdapter);

beforeEach(() => {
  jest.clearAllMocks();
});

test("cache", () => {
  style({
    background: "yellow",
  });
  style({
    background: "yellow",
  });
  expect(mockAdapter.appendCss).toHaveBeenCalledTimes(1);
});

test("basic styles", () => {
  const className = style({
    margin: "1rem",
    color: "blanchedalmond",
    border: "1px solid black",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
  });

  expect(className).toEqual(expect.any(String));
  expect(className?.length).toBeGreaterThan(0);

  expect(mockAdapter.appendCss).toHaveBeenCalledTimes(1);

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "local",
      selector: `.${className}`,
      rule: {
        margin: "1rem",
        color: "blanchedalmond",
        border: "1px solid black",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      },
    }),
  );
});

test("pseudo classes", () => {
  const className = style({
    "&:hover": {
      color: "green",
    },
  });

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "local",
      selector: `.${className}`,
      rule: {
        "&:hover": {
          color: "green",
        },
      },
    }),
  );
});

test("with classname provided", () => {
  const className = style(
    {
      color: "hotpink",
      "&:hover": {
        color: "red",
      },
      "&.test": {
        color: "blue",
      },
    },
    {
      className: "test",
    },
  );

  expect(className).toEqual("test");

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "local",
      selector: `.test`,
      rule: {
        color: "hotpink",
        "&:hover": {
          color: "red",
        },
        "&.test": {
          color: "blue",
        },
      },
    }),
  );
});
