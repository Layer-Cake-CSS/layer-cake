import { style, atoms } from "@layer-cake/core";
import { useState } from "react";
import { Component } from "./Component";

const getColor = () => {
  return "white";
};

export const App = () => {
  const [theme, setTheme] = useState("light");

  console.log(
    "class",
    style({
      // backgroundColor: theme === "light" ? "red" : "hotpink",
      color: getColor(),
      padding: "1rem",
    })
  );

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
          backgroundColor: theme === "light" ? "red" : "hotpink",
          color: "white",
          padding: "1rem",
        })}
      >
        Style
        <div
          className={atoms({
            backgroundColor: theme === "light" ? "blue" : "green",
            padding: "1rem",
          })}
        >
          Atoms
        </div>
      </div>
      <Component />
    </div>
  );
};
