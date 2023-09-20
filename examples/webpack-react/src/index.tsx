// import { render } from "react-dom";
// import { App } from "./App";

// const root = document.createElement("div");
// document.body.appendChild(root);

// render(<App />, root);

import { style } from "@layer-cake/core";
import ReactDOM from "react-dom/client";
import { App } from "./app";

const container = document.getElementById("root");

// Create a root.
const root = ReactDOM.createRoot(container!);

const className = style({
  backgroundColor: "red",
});

// Initial render
root.render(
  <div
    className={style({
      backgroundColor: "hotpink",
      color: "white",
      padding: "1rem",
    })}
  >
    <div className={className}>Hello world</div>
    <div
      className={style({
        backgroundColor: "blue",
        color: "white",
        padding: "1rem",
      })}
    >
      <div
        className={style({
          backgroundColor: "red",
          color: "white",
          padding: "1rem",
        })}
      >
        <App />
      </div>
    </div>

    {/* <App /> */}
  </div>
);
