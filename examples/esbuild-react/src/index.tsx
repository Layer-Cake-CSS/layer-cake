import { style } from "@layer-cake/core";
import ReactDOM from "react-dom/client";
// import { App } from "./app";

const container = document.getElementById("root");

// Create a root.
const root = ReactDOM.createRoot(container!);

// const className = style({
//   backgroundColor: "red",
// });

// Initial render
root.render(
  <div
    className={style({
      backgroundColor: "hotpink",
      color: "white",
      padding: "1rem",
    })}
  >
    {/* <App /> */}
  </div>
);
