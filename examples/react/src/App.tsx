import { style, atoms } from "@layer-cake/core";
import { useState } from "react";
import { Component } from "./Component";

const getColor = () => {
  return "white";
};

export const App = () => {
  const [theme, setTheme] = useState("light");

  // console.log(
  //   "class",
  //   style({
  //     // backgroundColor: theme === "light" ? "red" : "hotpink",
  //     color: getColor(),
  //     padding: "1rem",
  //   })
  // );

  return (
    <div>
      <button
        onClick={() =>
          theme === "light" ? setTheme("dark") : setTheme("light")
        }
      >
        Change theme
      </button>
      <div
        className={style({
          "--some-var": "1px",
          backgroundColor: theme === "light" ? "red" : "hotpink",
          color: "white",
          padding: "1rem",
        })}
      >
        Theme. I should be {theme === "light" ? "red" : "hotpink"}
        <div
          className={style({
            backgroundColor: "yellow",
            padding: "1rem",
          })}
        >
          Style
        </div>
        <div
          className={atoms({
            backgroundColor: theme === "light" ? "blue" : "green",
            padding: "1rem",
          })}
        >
          Atoms i should be {theme === "light" ? "blue" : "green"}
          <div className={atoms({ backgroundColor: "yellow" })}>Atoms </div>
        </div>
      </div>
      <Component />
    </div>
  );
};
