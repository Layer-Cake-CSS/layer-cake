import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { app } from "./app.css";
import { atoms, style } from "./layer-cake";
import { globalStyle } from "@layer-cake/core";

// import { style, atoms } from "@layer-cake/core";

globalStyle({
  body: {
    background: "gray",
  },
});

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div
        className={[
          app,
          style({ background: "yellow" }),
          atoms({
            margin: "1rem",
            color: "blanchedalmond",
            border: "1px solid black",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
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
            "&.foo": {
              color: "hotpink",
            },
            ".foobar": {
              color: "purple",
            },
            "@media screen and (min-width: 200px) and (max-width: 600px)": {
              color: "blue",
              border: "1px solid red",
            },
            "#foo": {
              color: "red",
            },
            "&#foo": {
              color: "red",
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
            "@media (min-width: 200px)": {
              "&:hover": {
                background: "black",
              },
            },
            "&:has(+ h1)": {
              background: "red",
            },
            "&:last-child": {
              background: "blue",
            },
          }),
        ].join(" ")}
      >
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
