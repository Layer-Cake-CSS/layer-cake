// import { render } from "react-dom";
// import { App } from "./App";

// const root = document.createElement("div");
// document.body.appendChild(root);

// render(<App />, root);

import { style } from "@layer-cake/core";
import ReactDOM from "react-dom/client";
// import { App } from "./App";
import { helloWorldStyle } from "./hello-world";

const container = document.getElementById("root");

// Create a root.
const root = ReactDOM.createRoot(container!);

const className = style(helloWorldStyle);

const styleFunction = () => ({
  backgroundColor: "hotpink",
  color: "white",
  padding: "1rem",
});
style(styleFunction());

const blue = {
  backgroundColor: "blue",
  color: "white",
  padding: "1rem",
};

// Initial render
root.render(
  <div
    // Object
    className={style({
      backgroundColor: "hotpink",
      color: "white",
      padding: "1rem",
    })}
  >
    i should be pink
    {/* Out of scope variable */}
    <div className={className}>Hello world</div>
    {/* In scope variable */}
    <div className={style(blue)}>
      i should be blue
      <div
        className={style({
          backgroundColor: "red",
          color: "white",
          padding: "1rem",
        })}
      >
        I should be red
        {/* <App /> */}
      </div>
    </div>
    {/* <App /> */}
  </div>
);
