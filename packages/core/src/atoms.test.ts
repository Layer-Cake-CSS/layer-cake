import { Adapter, setAdapter } from "./adapter";
import { atoms } from "./atoms";

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
  expect(atoms({ color: "red" })).toEqual(
    expect.stringContaining("color--red"),
  );
  expect(atoms({ color: "red" })).toEqual(
    expect.stringContaining("color--red"),
  );
  expect(mockAdapter.appendCss).toHaveBeenCalledTimes(1);
});

test("basic styles", () => {
  expect(
    atoms({
      margin: "1rem",
      color: "blanchedalmond",
      border: "1px solid black",
      gridTemplateColumns: "1fr 1fr",
    }),
  ).toEqual(
    expect.stringContaining(
      "margin--1rem color--blanchedalmond border--1px-solid-black grid-template-columns--1fr-1fr",
    ),
  );

  expect(mockAdapter.appendCss).toHaveBeenCalledTimes(4);

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "atomic",
      rule: {
        ".margin--1rem": {
          margin: "1rem",
        },
      },
    }),
  );

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "atomic",
      rule: {
        ".color--blanchedalmond": {
          color: "blanchedalmond",
        },
      },
    }),
  );

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "atomic",
      rule: {
        ".border--1px-solid-black": {
          border: "1px solid black",
        },
      },
    }),
  );

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "atomic",
      rule: {
        ".grid-template-columns--1fr-1fr": {
          "grid-template-columns": "1fr 1fr",
        },
      },
    }),
  );
});

test("simple pseudos", () => {
  expect(
    atoms({
      "&:hover": {
        color: "green",
      },
      "&:disabled:hover": {
        color: " gray",
      },
      "&:active": {
        "&:hover": {
          color: "red",
        },
      },
    }),
  ).toEqual(
    expect.stringContaining(
      "hover:color--green disabled:hover:color--gray active:hover:color--red",
    ),
  );

  expect(mockAdapter.appendCss).toHaveBeenCalledTimes(3);

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "atomic",
      rule: {
        ".hover\\:color--green:hover": {
          color: "green",
        },
      },
    }),
  );

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      rule: {
        ".disabled\\:hover\\:color--gray:disabled:hover": { color: "gray" },
      },
      type: "atomic",
    }),
  );

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "atomic",
      rule: {
        ".active\\:hover\\:color--red:active:hover": {
          color: "red",
        },
      },
    }),
  );
});

test("positional pseudos", () => {
  expect(
    atoms({
      "&:last-child": {
        background: "blue",
      },
    }),
  ).toEqual(expect.stringContaining("last-child:background--blue"));

  expect(mockAdapter.appendCss).toHaveBeenCalledTimes(1);

  expect(mockAdapter.appendCss).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "atomic",
      rule: {
        ".last-child\\:background--blue:last-child": {
          background: "blue",
        },
      },
    }),
  );
});

test("nested or combined selectors are not supported", () => {
  expect(
    atoms({
      "&.foo": {
        color: "hotpink",
      },
      ".foobar": {
        color: "purple",
      },
      "h1,h2": {
        color: "red",
      },
      "& + input": {
        color: "green",
      },
      "&[data-foo]:hover": {
        color: "orange",
      },
      "& > input": {
        color: "green",
      },
      "& [data-foo]": {
        color: "orange",
      },
    }),
  ).toEqual(expect.stringContaining(""));

  expect(mockAdapter.appendCss).toHaveBeenCalledTimes(0);
});

test("does not support :has pseudo", () => {
  expect(
    atoms({
      "&:has(+ h1)": {
        background: "red",
      },
    }),
  ).toEqual(expect.stringContaining(""));

  expect(mockAdapter.appendCss).toHaveBeenCalledTimes(0);
});

test("media queries", () => {
  expect(
    atoms({
      "@media screen and (min-width: 200px) and (max-width: 600px)": {
        color: "blue",
        border: "1px solid red",
      },
      "@media (min-width: 200px)": {
        "&:hover": {
          background: "black",
        },
      },
    }),
  ).toEqual(
    expect.stringContaining(
      "screen-min-200px-max-600px:color--blue screen-min-200px-max-600px:border--1px-solid-red min-200px:hover:background--black",
    ),
  );
});
